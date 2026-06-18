from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Image quality
# ---------------------------------------------------------------------------

class ImageQuality(BaseModel):
    quality_score: float
    face_detected: bool
    lighting_assessment: str  # good | poor | dark | bright
    passed_quality_gate: bool


# ---------------------------------------------------------------------------
# Skin condition result
# ---------------------------------------------------------------------------

class ConditionResult(BaseModel):
    condition_type: str
    severity_label: str          # none | mild | moderate | severe
    severity_score: float        # 0–100
    acne_subtype: str | None = None          # comedonal | inflammatory | cystic
    acne_lesion_count: int | None = None
    affected_zones: list[str] | None = None
    sebum_production: str | None = None     # low | normal | high
    oily_zones: list[str] | None = None


# ---------------------------------------------------------------------------
# Analysis response
# ---------------------------------------------------------------------------

class AnalysisResponse(BaseModel):
    analysis_id: UUID
    overall_health_score: float
    skin_health_label: str       # Poor | Fair | Good | Excellent
    model_version: str
    model_confidence: float
    inference_duration_ms: int
    image_quality: ImageQuality
    conditions: list[ConditionResult]
    referral_recommended: bool
    analysed_at: datetime


# ---------------------------------------------------------------------------
# Recommendation request / response
# ---------------------------------------------------------------------------

class RecommendationRequest(BaseModel):
    analysis_id: UUID
    known_skin_type: str = Field(..., pattern="^(oily|dry|combination|normal|sensitive)$")
    fitzpatrick_scale: int = Field(..., ge=1, le=6)
    price_tier_preference: str = Field(..., pattern="^(budget|mid|premium)$")
    is_halal_required: bool
    known_allergies: list[str] = []


class ProductItem(BaseModel):
    product_name: str
    brand_name: str
    price_myr: float
    price_tier: str
    is_halal: bool
    key_ingredient: str
    match_score: float


class RoutineStep(BaseModel):
    step_number: int
    step_name: str
    instruction: str
    products: list[ProductItem]


class RecommendationResponse(BaseModel):
    recommendation_id: UUID
    overall_match_score: float
    reasoning_text: str
    am_routine: list[RoutineStep]
    pm_routine: list[RoutineStep]
    safety_warnings: list[str]
    referral_note: str | None = None


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    model_mode: str
    model_version: str
    supabase_connected: bool
    detail: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# HAM10000 disease prediction  (/predict endpoint)
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    image: str  # base64-encoded image; data URI prefix (data:image/...;base64,) is stripped


class PredictResponse(BaseModel):
    condition: str    # e.g. "Melanoma"
    confidence: str   # e.g. "87.3%"
    severity: str     # Mild | Moderate | Severe
    description: str  # 2-sentence plain-English explanation


# ---------------------------------------------------------------------------
# Error
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    error: str
    detail: str
    code: str
