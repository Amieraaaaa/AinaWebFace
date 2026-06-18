import logging
import random
import time
from pathlib import Path

import numpy as np  # type: ignore[import]

from core.config import settings

logger = logging.getLogger(__name__)

CONDITIONS = ["acne", "dryness", "oiliness", "pigmentation", "texture", "sensitivity", "redness"]

# Aurora model class names — index order matches yasyn14/skin-analyzer training.
# Source: https://huggingface.co/spaces/yasyn14/aurora/raw/main/config.py
AURORA_CLASSES = [
    "acne",          # index 0
    "dryness",       # index 1
    "eczema",        # index 2
    "normal",        # index 3
    "oilyness",      # index 4
    "pigmentation",  # index 5
    "redness",       # index 6
    "scars",         # index 7
    "wrinkles",      # index 8
]

# Human-readable display names (fixes the "oilyness" typo from the model)
AURORA_DISPLAY = {
    "acne":         "Acne",
    "dryness":      "Dryness",
    "eczema":       "Eczema",
    "normal":       "Healthy Skin",
    "oilyness":     "Oily Skin",
    "pigmentation": "Pigmentation",
    "redness":      "Redness",
    "scars":        "Scars",
    "wrinkles":     "Wrinkles",
}

AURORA_DESCRIPTIONS = {
    "acne": (
        "Acne occurs when hair follicles become clogged with oil and dead skin cells, causing inflamed "
        "red bumps or pustules most often on the face, forehead, and chin."
    ),
    "dryness": (
        "Dry skin lacks sufficient moisture, leading to a tight, flaky, or rough texture. "
        "It is often caused by environmental factors, harsh cleansers, or a weakened skin barrier."
    ),
    "eczema": (
        "Eczema is an inflammatory skin condition that causes itchy, red, and cracked patches. "
        "It is linked to a weakened skin barrier and immune hypersensitivity, and requires gentle skincare management."
    ),
    "normal": (
        "No significant skin concerns were detected in this image. "
        "Continue your current skincare routine and protect your skin with daily SPF to maintain this healthy state."
    ),
    "oilyness": (
        "Oily skin is characterised by excess sebum production, giving the face a shiny appearance and enlarging pores. "
        "It can be managed with gentle, non-comedogenic cleansers and lightweight, oil-free moisturisers."
    ),
    "pigmentation": (
        "Skin pigmentation refers to dark spots or uneven skin tone caused by excess melanin production. "
        "Common triggers include sun exposure, acne scars, and hormonal changes."
    ),
    "redness": (
        "Skin redness occurs when blood vessels near the surface dilate, often due to irritation, "
        "sensitivity, or environmental triggers like heat, wind, or harsh products."
    ),
    "scars": (
        "Scars form as part of the skin's natural healing process after injury or acne, leaving raised, "
        "sunken, or discoloured marks that may fade over time with targeted treatments."
    ),
    "wrinkles": (
        "Wrinkles are lines and creases that develop as skin loses collagen and elasticity with age, "
        "accelerated by sun exposure, dehydration, and repeated facial expressions."
    ),
}


class SkinClassifier:
    """MobileNetV2-based multi-head skin condition classifier.

    In MODEL_MODE=demo the model returns deterministic-random scores so the
    full API pipeline can be tested without trained weights.
    In MODEL_MODE=inference it loads the .h5 weights and runs real inference.
    """

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self.mode = settings.model_mode
        self.version = settings.model_version

        if self.mode == "inference":
            self._load_model()
        else:
            logger.info("SkinClassifier running in DEMO mode — no weights loaded")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict(self, image_array: np.ndarray) -> dict:
        """Run inference on a preprocessed (224×224×3, float32) image array.

        Args:
            image_array: Numpy array with shape (224, 224, 3), values 0–1.

        Returns:
            Dict with per-condition severity scores (0–100) and confidence.
        """
        start = time.perf_counter()

        if self.mode == "demo":
            scores = self._demo_predict(image_array)
        else:
            scores = self._real_predict(image_array)

        duration_ms = int((time.perf_counter() - start) * 1000)
        confidence = float(np.mean([v / 100 for v in scores.values()]))

        return {
            "scores": scores,
            "confidence": round(min(max(confidence, 0.60), 0.99), 2),
            "inference_duration_ms": duration_ms,
            "model_version": self.version,
        }

    @property
    def is_loaded(self) -> bool:
        return self.mode == "demo" or self._loaded

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _demo_predict(self, image_array: np.ndarray) -> dict[str, float]:
        """Return plausible-looking scores derived from image pixel stats."""
        seed = int(np.mean(image_array) * 1000) % (2**31)
        rng = random.Random(seed)
        return {condition: round(rng.uniform(10, 70), 1) for condition in CONDITIONS}

    def _real_predict(self, image_array: np.ndarray) -> dict[str, float]:
        """Run the loaded TensorFlow model."""
        import tensorflow as tf  # noqa: PLC0415 — lazy import to avoid cold-start penalty

        batch = np.expand_dims(image_array, axis=0)
        predictions = self._model.predict(batch, verbose=0)
        return {
            condition: round(float(predictions[i][0][1]) * 100, 1)
            for i, condition in enumerate(CONDITIONS)
        }

    def _load_model(self) -> None:
        weights_path = Path(settings.model_weights_path)
        if not weights_path.exists():
            logger.warning(
                "Weights file not found at %s — falling back to demo mode", weights_path
            )
            self.mode = "demo"
            return

        try:
            import tensorflow as tf  # noqa: PLC0415

            self._model = tf.keras.models.load_model(str(weights_path))
            self._loaded = True
            logger.info("MobileNetV2 weights loaded from %s", weights_path)
        except Exception:
            logger.exception("Failed to load model weights — falling back to demo mode")
            self.mode = "demo"


# Singleton — imported by analysis_service
classifier = SkinClassifier()


# ---------------------------------------------------------------------------
# Skin defect classifier  (/predict endpoint)
# Uses the Aurora model: yasyn14/skin-analyzer  (model-v1.keras)
# Preprocessing: keras.applications.efficientnet.preprocess_input
# ---------------------------------------------------------------------------

_AURORA_REPO   = "yasyn14/skin-analyzer"
_AURORA_FILE   = "model-v1.keras"
_HEALTHY_LABELS = {"normal", "healthy", "healthy skin", "clear"}
# Eczema shares strong visual traits with dryness and redness; the model
# frequently mis-fires on these overlapping features. Only report eczema when
# the model is highly confident — otherwise fall back to the second-best class.
_ECZEMA_MIN_CONFIDENCE = 0.75


class SkinDefectClassifier:
    """EfficientNet-based skin condition classifier using Aurora's pre-trained model.

    On first run with MODEL_MODE=inference, downloads model-v1.keras from
    yasyn14/skin-analyzer on HuggingFace Hub (cached locally afterwards).
    Falls back to deterministic demo mode when MODEL_MODE=demo or download fails.
    """

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self.mode = settings.model_mode
        self.version = settings.model_version

        if self.mode == "inference":
            self._load_model()
        else:
            logger.info("SkinDefectClassifier running in DEMO mode — Aurora model not loaded")

    @property
    def is_loaded(self) -> bool:
        return self.mode == "demo" or self._loaded

    def predict_defect(self, pil_image: "Image.Image") -> dict:
        """Predict the dominant skin condition from a PIL Image (224×224 recommended).

        Args:
            pil_image: RGB PIL Image, already resized to 224×224.

        Returns:
            Dict with: condition, confidence (str %), severity, description,
                       inference_duration_ms, model_version.
        """
        start = time.perf_counter()

        arr = np.array(pil_image, dtype=np.float32)  # shape (224, 224, 3), values 0–255

        if self.mode == "demo":
            raw_label, confidence = self._demo_predict(arr)
        else:
            raw_label, confidence = self._real_predict(arr)

        duration_ms = int((time.perf_counter() - start) * 1000)
        display_name = AURORA_DISPLAY.get(raw_label, raw_label.replace("_", " ").title())

        pct = round(confidence * 100, 1)
        if raw_label in _HEALTHY_LABELS:
            severity = "None"
        elif pct >= 80:
            severity = "Severe"
        elif pct >= 60:
            severity = "Moderate"
        else:
            severity = "Mild"

        return {
            "condition": display_name,
            "confidence": f"{pct}%",
            "confidence_raw": round(confidence, 4),
            "severity": severity,
            "description": AURORA_DESCRIPTIONS.get(
                raw_label,
                f"{display_name} is a detected skin concern. "
                "Consult a skincare professional for personalised advice.",
            ),
            "inference_duration_ms": duration_ms,
            "model_version": self.version,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _demo_predict(self, image_array: np.ndarray) -> tuple[str, float]:
        seed = int(np.mean(image_array) * 1000) % (2**31)
        rng = random.Random(seed)
        # Exclude eczema from demo picks — it requires the real model's high
        # confidence to be reported (see _ECZEMA_MIN_CONFIDENCE).
        demo_classes = [c for c in AURORA_CLASSES if c != "eczema"]
        raw_label = rng.choice(demo_classes)
        confidence = rng.uniform(0.55, 0.95)
        return raw_label, round(confidence, 4)

    def _real_predict(self, image_array: np.ndarray) -> tuple[str, float]:
        import tensorflow as tf  # noqa: PLC0415

        # Aurora uses EfficientNet preprocessing (NOT MobileNetV2)
        arr = tf.keras.applications.efficientnet.preprocess_input(
            np.expand_dims(image_array, axis=0)
        )
        with tf.device("/CPU:0"):
            probs = self._model.predict(arr, verbose=0)[0]

        sorted_indices = np.argsort(probs)[::-1]
        top_index = int(sorted_indices[0])
        raw_label = AURORA_CLASSES[top_index]
        confidence = float(probs[top_index])

        # Eczema visually overlaps with dryness/redness; only report it when the
        # model is sufficiently confident, otherwise use the second-best class.
        if raw_label == "eczema" and confidence < _ECZEMA_MIN_CONFIDENCE:
            second_index = int(sorted_indices[1])
            raw_label = AURORA_CLASSES[second_index]
            confidence = float(probs[second_index])

        return raw_label, confidence

    def _load_model(self) -> None:
        """Download model-v1.keras from yasyn14/skin-analyzer via HuggingFace Hub."""
        try:
            from huggingface_hub import hf_hub_download  # noqa: PLC0415
            import tensorflow as tf  # noqa: PLC0415

            logger.info("Downloading Aurora skin model from %s ...", _AURORA_REPO)
            model_path = hf_hub_download(
                repo_id=_AURORA_REPO,
                filename=_AURORA_FILE,
            )
            self._model = tf.keras.models.load_model(model_path)
            self._loaded = True
            logger.info("Aurora skin model loaded successfully (%s)", _AURORA_FILE)
        except Exception:
            logger.exception(
                "Failed to load Aurora model from HuggingFace Hub — falling back to demo mode"
            )
            self.mode = "demo"


# Singleton — imported by /predict route
skin_defect_classifier = SkinDefectClassifier()
