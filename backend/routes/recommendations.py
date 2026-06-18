import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from core.security import get_current_user
from models.schemas import RecommendationRequest, RecommendationResponse
from services.recommender import generate_recommendation
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommend", tags=["Recommendations"])


@router.post("", response_model=RecommendationResponse, status_code=status.HTTP_201_CREATED)
async def create_recommendation(
    body: RecommendationRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> RecommendationResponse:
    """Generate an AM/PM skincare routine from a completed analysis.

    Requires the analysis to belong to the authenticated user.
    Applies ingredient scoring, incompatibility resolution, allergy filtering,
    and price/halal filtering before building the routine.
    """
    user_id: str = current_user["sub"]
    client = await get_supabase()

    # Verify the analysis exists and belongs to this user
    analysis_resp = (
        await client.table("skin_analyses")
        .select("preprocessing_flags")
        .eq("analysis_id", str(body.analysis_id))
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not analysis_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NOT_FOUND",
                "detail": "Analysis not found or does not belong to you.",
                "code": "NOT_FOUND",
            },
        )

    flags: dict = analysis_resp.data.get("preprocessing_flags") or {}
    condition_scores: dict[str, float] = flags.get("raw_model_output", {})

    try:
        result = await generate_recommendation(body, condition_scores, user_id)
    except Exception as exc:
        logger.exception("Recommendation generation failed for analysis %s", body.analysis_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "INTERNAL_ERROR",
                "detail": "Failed to generate recommendation.",
                "code": "INTERNAL_ERROR",
            },
        ) from exc

    return result


@router.get("/{analysis_id}", response_model=RecommendationResponse)
async def get_recommendation(
    analysis_id: UUID,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> RecommendationResponse:
    """Fetch the most recent saved recommendation for an analysis."""
    user_id: str = current_user["sub"]
    client = await get_supabase()

    resp = (
        await client.table("recommendations")
        .select("*")
        .eq("analysis_id", str(analysis_id))
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NOT_FOUND",
                "detail": "No recommendation found for this analysis.",
                "code": "NOT_FOUND",
            },
        )

    row = resp.data[0]
    breakdown = row.get("scoring_breakdown") or {}

    return RecommendationResponse(
        recommendation_id=row["recommendation_id"],
        overall_match_score=row["match_score"],
        reasoning_text=row.get("reasoning_text") or "",
        am_routine=breakdown.get("am_routine", []),
        pm_routine=breakdown.get("pm_routine", []),
        safety_warnings=breakdown.get("safety_warnings", []),
        referral_note=breakdown.get("referral_note"),
    )
