import base64
import io
import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from PIL import Image

from core.config import settings
from core.security import get_current_user
from models.schemas import AnalysisResponse, PredictRequest, PredictResponse
from models.skin_classifier import skin_defect_classifier
from services.analysis_service import run_analysis
from services.image_processor import ImageQualityError, validate_mime, validate_size
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("/", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_image(
    file: UploadFile,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AnalysisResponse:
    """Upload a facial image and run the full AI skin analysis pipeline.

    - Validates MIME type and file size
    - Runs OpenCV quality gate (face detection, sharpness, lighting)
    - Runs MobileNetV2 CNN inference
    - Persists results to Supabase
    - Returns structured analysis JSON
    """
    user_id: str = current_user["sub"]

    data = await file.read()
    content_type = file.content_type or ""
    logger.debug("Analyze request — user=%s content_type=%r size=%d", user_id, content_type, len(data))

    try:
        validate_mime(content_type)
        validate_size(len(data))

        result = await run_analysis(
            image_data=data,
            content_type=content_type,
            user_id=user_id,
        )
    except ImageQualityError as exc:
        logger.warning("Quality gate rejected image for user %s: [%s] %s", user_id, exc.code, exc.detail)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": exc.code, "detail": exc.detail, "code": exc.code},
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during analysis for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INTERNAL_ERROR", "detail": "An unexpected error occurred.", "code": "INTERNAL_ERROR"},
        ) from exc

    return result


@router.post("/predict", response_model=PredictResponse, tags=["Analysis"])
async def predict_disease(
    body: PredictRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PredictResponse:
    """Detect the dominant skin defect in a facial image.

    Accepts a Base64-encoded image (JPEG/PNG/WEBP), with or without the
    ``data:image/...;base64,`` URI prefix. Returns the predicted skin defect,
    confidence percentage, severity level, and a plain-English description.
    """
    # --- 1. Decode base64 ---------------------------------------------------
    raw_b64 = body.image
    if "," in raw_b64:                         # strip data URI prefix
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_BASE64", "detail": "Image is not valid base64.", "code": "INVALID_BASE64"},
        )

    # --- 2. Open and preprocess ---------------------------------------------
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_IMAGE", "detail": "Could not decode image. Use JPEG, PNG, or WEBP.", "code": "INVALID_IMAGE"},
        )

    size = settings.target_image_size  # 224
    resized = pil_img.resize((size, size), Image.LANCZOS)

    # --- 3. Inference -------------------------------------------------------
    try:
        result = skin_defect_classifier.predict_defect(resized)
    except Exception:
        logger.exception("Skin defect inference failed for user %s", current_user.get("sub"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "INFERENCE_ERROR", "detail": "Model inference failed.", "code": "INFERENCE_ERROR"},
        )

    return PredictResponse(
        condition=result["condition"],
        confidence=result["confidence"],
        severity=result["severity"],
        description=result["description"],
    )


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: UUID,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AnalysisResponse:
    """Fetch a previously saved analysis by ID."""
    user_id: str = current_user["sub"]
    client = await get_supabase()

    response = (
        await client.table("skin_analyses")
        .select("*, skin_condition_results(*)")
        .eq("analysis_id", str(analysis_id))
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "NOT_FOUND", "detail": "Analysis not found.", "code": "NOT_FOUND"},
        )

    row = response.data
    flags = row.get("preprocessing_flags") or {}
    conditions = [
        {
            "condition_type": c["condition_type"],
            "severity_label": c["severity_label"],
            "severity_score": c["severity_score"],
            "acne_subtype": c.get("acne_subtype"),
            "acne_lesion_count": c.get("acne_lesion_count"),
            "affected_zones": c.get("affected_zones") or [],
            "sebum_production": c.get("sebum_production"),
            "oily_zones": c.get("oily_zones") or [],
        }
        for c in row.get("skin_condition_results", [])
    ]

    health_score = row["overall_health_score"]
    stored_label = flags.get("skin_health_label")
    if not stored_label:
        if health_score >= 80:
            stored_label = "Excellent"
        elif health_score >= 60:
            stored_label = "Good"
        elif health_score >= 40:
            stored_label = "Fair"
        else:
            stored_label = "Poor"

    return AnalysisResponse(
        analysis_id=row["analysis_id"],
        overall_health_score=health_score,
        skin_health_label=stored_label,
        model_version=row["model_version"],
        model_confidence=row["model_confidence"],
        inference_duration_ms=row.get("inference_duration_ms", 0),
        image_quality={
            "quality_score": 0.0,
            "face_detected": True,
            "lighting_assessment": "good",
            "passed_quality_gate": True,
        },
        conditions=conditions,
        referral_recommended=flags.get("referral_recommended", False),
        analysed_at=row["analysed_at"],
    )
