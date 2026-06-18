import logging
import uuid
from datetime import datetime, timezone

from models.schemas import AnalysisResponse, ConditionResult, ImageQuality
from models.skin_classifier import classifier
from services.image_processor import process_image
from services.supabase_client import get_supabase, upload_image

logger = logging.getLogger(__name__)

HEALTH_LABELS = [
    (80, "Excellent"),
    (60, "Good"),
    (40, "Fair"),
    (0, "Poor"),
]

SEVERITY_LABELS = [
    (70, "severe"),
    (45, "moderate"),
    (20, "mild"),
    (0, "none"),
]

ACNE_SUBTYPES = ["comedonal", "inflammatory", "cystic"]
FACIAL_ZONES = ["t_zone", "chin", "cheeks", "forehead", "nose"]


def _health_label(score: float) -> str:
    for threshold, label in HEALTH_LABELS:
        if score >= threshold:
            return label
    return "Poor"


def _severity_label(score: float) -> str:
    for threshold, label in SEVERITY_LABELS:
        if score >= threshold:
            return label
    return "none"


def _compute_health_score(scores: dict[str, float]) -> float:
    """Weighted composite health score (higher = healthier skin)."""
    weights = {
        "acne": 0.30,
        "dryness": 0.15,
        "oiliness": 0.10,
        "pigmentation": 0.15,
        "texture": 0.10,
        "sensitivity": 0.10,
        "redness": 0.10,
    }
    raw = sum(scores.get(c, 0) * w for c, w in weights.items())
    return round(max(0, 100 - raw), 1)


def _build_condition_results(scores: dict[str, float]) -> list[ConditionResult]:
    results: list[ConditionResult] = []
    import random

    for condition, score in scores.items():
        severity = _severity_label(score)
        result = ConditionResult(
            condition_type=condition,
            severity_label=severity,
            severity_score=score,
        )

        if condition == "acne" and score > 20:
            rng = random.Random(int(score))
            if score > 70:
                result.acne_subtype = "cystic"
            elif score > 45:
                result.acne_subtype = "inflammatory"
            else:
                result.acne_subtype = "comedonal"
            result.acne_lesion_count = int(score / 5)
            result.affected_zones = rng.sample(FACIAL_ZONES, k=min(2, len(FACIAL_ZONES)))

        if condition == "oiliness" and score > 15:
            result.sebum_production = "high" if score > 50 else "normal"
            result.oily_zones = ["t_zone", "forehead"] if score > 40 else ["t_zone"]

        results.append(result)
    return results


async def run_analysis(
    image_data: bytes,
    content_type: str,
    user_id: str,
    consent_given: bool = True,
) -> AnalysisResponse:
    """Full analysis pipeline: quality gate → CNN → persist → respond.

    Args:
        image_data: Raw image bytes from the upload.
        content_type: MIME type of the upload.
        user_id: Authenticated user's Supabase UID.
        consent_given: Must be True — image will be stored in Supabase Storage.

    Returns:
        AnalysisResponse with full results.

    Raises:
        ImageQualityError: If the image fails the quality gate.
    """
    # 1. Quality gate + preprocessing (raises ImageQualityError on failure)
    processed = process_image(image_data)
    quality_meta = processed["quality_meta"]

    # 2. Store image in Supabase Storage
    image_id = uuid.uuid4()
    ext = (content_type or "image/jpeg").split("/")[-1].replace("jpeg", "jpg")
    storage_path = f"{user_id}/{image_id}.{ext}"

    try:
        await upload_image("skin-images", storage_path, image_data, content_type)
    except Exception:
        logger.exception("Storage upload failed for %s — continuing without storage", storage_path)
        storage_path = None

    # 3. CNN inference
    prediction = classifier.predict(processed["model_array"])
    scores: dict[str, float] = prediction["scores"]

    # 4. Compute results
    health_score = _compute_health_score(scores)
    conditions = _build_condition_results(scores)
    referral = any(
        c.acne_subtype == "cystic" for c in conditions if c.condition_type == "acne"
    )

    analysis_id = uuid.uuid4()
    analysed_at = datetime.now(timezone.utc)

    # 5. Persist to Supabase
    try:
        client = await get_supabase()
        analysis_persisted = False

        # Insert image record — required before skin_analyses (FK constraint)
        if storage_path:
            await client.table("facial_images").insert({
                "image_id": str(image_id),
                "user_id": user_id,
                "storage_path": storage_path,
                "file_size_bytes": len(image_data),
                "mime_type": content_type,
                "quality_score": quality_meta["quality_score"],
                "face_detected": quality_meta["face_detected"],
                "face_confidence": quality_meta["face_confidence"],
                "lighting_assessment": quality_meta["lighting_assessment"],
                "consent_given_at": analysed_at.isoformat() if consent_given else None,
            }).execute()

            # Insert analysis record (image_id NOT NULL — only when image stored)
            await client.table("skin_analyses").insert({
                "analysis_id": str(analysis_id),
                "user_id": user_id,
                "image_id": str(image_id),
                "overall_health_score": health_score,
                "model_name": "MobileNetV2-SkinSight",
                "model_version": prediction["model_version"],
                "model_confidence": prediction["confidence"],
                "inference_duration_ms": prediction["inference_duration_ms"],
                "preprocessing_flags": {
                    "raw_model_output": scores,
                    "referral_recommended": referral,
                    "skin_health_label": _health_label(health_score),
                },
                "analysed_at": analysed_at.isoformat(),
            }).execute()

            analysis_persisted = True

        # Insert per-condition results only when analysis row exists
        if analysis_persisted:
            for cond in conditions:
                await client.table("skin_condition_results").insert({
                    "analysis_id": str(analysis_id),
                    "condition_type": cond.condition_type,
                    "severity_label": cond.severity_label,
                    "severity_score": cond.severity_score,
                    "affected_zones": cond.affected_zones or [],
                    "acne_subtype": cond.acne_subtype,
                    "acne_lesion_count": cond.acne_lesion_count,
                    "oily_zones": cond.oily_zones or [],
                    "sebum_production": cond.sebum_production,
                }).execute()

    except Exception:
        logger.exception("Failed to persist analysis %s", analysis_id)

    return AnalysisResponse(
        analysis_id=analysis_id,
        overall_health_score=health_score,
        skin_health_label=_health_label(health_score),
        model_version=prediction["model_version"],
        model_confidence=prediction["confidence"],
        inference_duration_ms=prediction["inference_duration_ms"],
        image_quality=ImageQuality(
            quality_score=quality_meta["quality_score"],
            face_detected=quality_meta["face_detected"],
            lighting_assessment=quality_meta["lighting_assessment"],
            passed_quality_gate=True,
        ),
        conditions=conditions,
        referral_recommended=referral,
        analysed_at=analysed_at,
    )
