import io
import logging

import cv2
import numpy as np
from PIL import Image, ImageOps

from core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class ImageQualityError(Exception):
    """Raised when the image fails the quality gate."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


def validate_mime(content_type: str) -> None:
    if content_type not in ALLOWED_MIME_TYPES:
        raise ImageQualityError(
            "UNSUPPORTED_FORMAT",
            f"File type '{content_type}' is not supported. Use JPEG, PNG, or WEBP.",
        )


def validate_size(size_bytes: int) -> None:
    if size_bytes > MAX_FILE_SIZE_BYTES:
        raise ImageQualityError(
            "FILE_TOO_LARGE",
            f"File size {size_bytes / 1024 / 1024:.1f} MB exceeds the 10 MB limit.",
        )


def _load_pil(data: bytes) -> Image.Image:
    """Load image bytes into a PIL Image, correcting EXIF orientation."""
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return ImageOps.exif_transpose(img)


_IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def _detect_face(bgr: np.ndarray) -> tuple[float, tuple[int, int, int, int] | None]:
    """Return face detection confidence and bounding box using Haar cascade.

    Returns:
        Tuple of (confidence 0–1, (x, y, w, h) of largest face or None).
    """
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    faces = cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(50, 50))
    if len(faces) == 0:
        return 0.0, None
    largest_box = max(faces, key=lambda b: b[2] * b[3])
    x, y, w, h = largest_box
    img_area = bgr.shape[0] * bgr.shape[1]
    # Scale so a face covering 10% of the frame → confidence 1.0 (realistic for arm's-length selfies)
    confidence = min((w * h) / img_area * 10, 1.0)
    return round(float(confidence), 3), (int(x), int(y), int(w), int(h))


def _sharpness_score(gray: np.ndarray) -> float:
    """Laplacian variance normalised to 0–1."""
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return round(min(float(variance) / 500.0, 1.0), 3)


def _lighting_assessment(bgr: np.ndarray) -> tuple[str, float]:
    """Assess lighting from HSV brightness channel.

    Returns:
        Tuple of (label, brightness_mean).
    """
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    brightness = float(hsv[:, :, 2].mean())
    if brightness < 60:
        label = "dark"
    elif brightness > 220:
        label = "bright"
    else:
        label = "good"
    return label, round(brightness, 1)


def _composite_quality(sharpness: float, face_confidence: float, lighting: str) -> float:
    lighting_score = {"good": 1.0, "bright": 0.7, "dark": 0.3}.get(lighting, 0.5)
    return round(sharpness * 0.4 + face_confidence * 0.4 + lighting_score * 0.2, 3)


def process_image(data: bytes) -> dict:
    """Run the full OpenCV quality pipeline on raw image bytes.

    Args:
        data: Raw image bytes (JPEG/PNG/WEBP).

    Returns:
        Dict with keys: pil_image, bgr_array, model_array, quality_meta.

    Raises:
        ImageQualityError: If the image fails any quality gate.
    """
    pil_img = _load_pil(data)
    bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    face_confidence, face_box = _detect_face(bgr)
    sharpness = _sharpness_score(gray)
    lighting_label, brightness = _lighting_assessment(bgr)
    quality_score = _composite_quality(sharpness, face_confidence, lighting_label)

    # --- quality gate checks ---
    if face_confidence < settings.min_face_confidence:
        raise ImageQualityError(
            "NO_FACE_DETECTED",
            "No face detected in the image. Please take a clear front-facing selfie.",
        )
    if lighting_label == "dark":
        raise ImageQualityError(
            "POOR_LIGHTING",
            "Image is too dark. Move to a well-lit area and try again.",
        )
    if sharpness < 0.05:
        raise ImageQualityError(
            "IMAGE_TOO_BLURRY",
            "Image is too blurry. Hold the camera steady and try again.",
        )
    if quality_score < settings.min_quality_score:
        raise ImageQualityError(
            "IMAGE_QUALITY_TOO_LOW",
            f"Overall image quality score {quality_score:.2f} is below the minimum "
            f"{settings.min_quality_score}. Ensure good lighting and a clear face view.",
        )

    # --- crop to face region, then prepare model input (224×224, ImageNet-normalised) ---
    size = settings.target_image_size
    if face_box is not None:
        x, y, w, h = face_box
        # Add 20% padding around the detected face so forehead/chin are included
        pad_x = int(w * 0.20)
        pad_y = int(h * 0.20)
        ih, iw = bgr.shape[:2]
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(iw, x + w + pad_x)
        y2 = min(ih, y + h + pad_y)
        face_pil = pil_img.crop((x1, y1, x2, y2))
    else:
        face_pil = pil_img

    resized = face_pil.resize((size, size), Image.LANCZOS)
    model_array = np.array(resized, dtype=np.float32) / 255.0
    model_array = (model_array - _IMAGENET_MEAN) / _IMAGENET_STD

    return {
        "pil_image": pil_img,
        "bgr_array": bgr,
        "model_array": model_array,
        "quality_meta": {
            "quality_score": quality_score,
            "face_detected": face_confidence >= settings.min_face_confidence,
            "face_confidence": face_confidence,
            "sharpness": sharpness,
            "lighting_assessment": lighting_label,
            "brightness": brightness,
            "passed_quality_gate": True,
        },
    }
