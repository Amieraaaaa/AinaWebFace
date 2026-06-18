import logging
import uuid
from datetime import datetime, timezone

from models.schemas import ProductItem, RecommendationRequest, RecommendationResponse, RoutineStep
from services.ingredient_rules import (
    get_candidate_ingredients,
    resolve_incompatible_pairs,
)
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

# AM / PM step definitions — order matters
AM_STEPS = ["Cleanser", "Toner", "Serum", "Treatment", "Moisturiser", "SPF"]
PM_STEPS = ["Cleanser", "Treatment", "Serum", "Moisturiser"]

FITZPATRICK_DEMOTION_FACTOR = 0.15  # score penalty per demoted ingredient


def _score_ingredient(rule, severity_score: float, fitzpatrick: int) -> float:
    """Compute composite ingredient score.

    Formula: severity×strength (45%) + evidence (30%) + skin_type (20%) + fitzpatrick (5%).
    """
    severity_norm = min(severity_score / 100, 1.0)
    base = (
        severity_norm * rule.strength_score * 0.45
        + rule.evidence_score * 0.30
        + 0.20  # skin_type already filtered upstream
        + 0.05  # fitzpatrick base contribution
    )
    if fitzpatrick in rule.fitzpatrick_demotion:
        base -= FITZPATRICK_DEMOTION_FACTOR
    return round(min(max(base, 0.0), 1.0), 4)


def _build_demo_products(inci_name: str, tier: str, is_halal_required: bool) -> list[ProductItem]:
    """Return a placeholder product when no DB product exists (demo mode).

    Each product has a fixed halal status. When is_halal_required=True, non-halal
    products are filtered out rather than stamped with the user preference.
    """
    # (name, brand, price_myr, is_halal)
    demo_map: dict[str, tuple[str, str, float, bool]] = {
        "SALICYLIC_ACID":    ("Paula's Choice BHA Exfoliant",         "Paula's Choice", 89.0,  False),
        "NIACINAMIDE":       ("The Ordinary Niacinamide 10% + Zinc",  "The Ordinary",   25.0,  True),
        "HYALURONIC_ACID":   ("Neutrogena Hydro Boost Water Gel",     "Neutrogena",     49.0,  True),
        "VITAMIN_C":         ("Skinceuticals CE Ferulic",              "Skinceuticals", 320.0, False),
        "RETINOL":           ("Olay Regenerist Retinol24",             "Olay",           79.0,  True),
        "CERAMIDE_NP":       ("CeraVe Moisturising Cream",            "CeraVe",         45.0,  True),
        "AZELAIC_ACID":      ("The Ordinary Azelaic Acid Suspension",  "The Ordinary",   28.0,  True),
        "CENTELLA_ASIATICA": ("COSRX Centella Water Alcohol-Free",    "COSRX",          35.0,  True),
        "BENZOYL_PEROXIDE":  ("Benzac AC 2.5% Gel",                   "Benzac",         22.0,  False),
        "GLYCERIN":          ("Simple Kind to Skin Moisturiser",      "Simple",         18.0,  True),
        "SQUALANE":          ("The Inkey List Squalane Oil",           "The Inkey List", 38.0,  True),
        "GLYCOLIC_ACID":     ("The Ordinary Glycolic Acid 7% Toning", "The Ordinary",   29.0,  True),
        "LACTIC_ACID":       ("The Ordinary Lactic Acid 10%",         "The Ordinary",   22.0,  True),
        "ALPHA_ARBUTIN":     ("The Ordinary Alpha Arbutin 2%",        "The Ordinary",   24.0,  True),
        "ZINC_PCA":          ("The Ordinary Zinc PCA",                 "The Ordinary",   15.0,  True),
        "VITAMIN_C":         ("Naturium Vitamin C Complex Serum",      "Naturium",       45.0,  True),
        "PANTHENOL":         ("La Roche-Posay Cicaplast Baume B5",    "La Roche-Posay", 65.0,  False),
        "ALLANTOIN":         ("Eucerin Aquaphor Soothing Skin Balm",  "Eucerin",        35.0,  True),
        "POLYHYDROXY_ACID":  ("NeoStrata Bionic Face Cream",          "NeoStrata",      89.0,  True),
        "GREEN_TEA_EXTRACT": ("Innisfree Green Tea Seed Serum",       "Innisfree",      55.0,  True),
    }

    entry = demo_map.get(inci_name)
    if entry:
        name, brand, price, product_is_halal = entry
    else:
        name, brand, price, product_is_halal = (f"{inci_name} Serum", "Generic", 30.0, True)

    if is_halal_required and not product_is_halal:
        return []

    return [
        ProductItem(
            product_name=name,
            brand_name=brand,
            price_myr=price,
            price_tier=tier,
            is_halal=product_is_halal,
            key_ingredient=inci_name,
            match_score=0.80,
        )
    ]


def _assign_step(inci_name: str) -> tuple[str | None, str | None]:
    """Map an ingredient to an AM and/or PM routine step."""
    step_map = {
        "SALICYLIC_ACID": ("Cleanser", "Treatment"),
        "BENZOYL_PEROXIDE": ("Treatment", "Treatment"),
        "NIACINAMIDE": ("Serum", "Serum"),
        "AZELAIC_ACID": ("Serum", "Treatment"),
        "RETINOL": (None, "Treatment"),
        "HYALURONIC_ACID": ("Serum", "Serum"),
        "CERAMIDE_NP": ("Moisturiser", "Moisturiser"),
        "GLYCERIN": ("Moisturiser", "Moisturiser"),
        "SQUALANE": ("Moisturiser", "Moisturiser"),
        "VITAMIN_C": ("Serum", None),
        "GLYCOLIC_ACID": (None, "Treatment"),
        "LACTIC_ACID": (None, "Treatment"),
        "CENTELLA_ASIATICA": ("Toner", "Serum"),
        "PANTHENOL": ("Moisturiser", "Moisturiser"),
        "ALLANTOIN": ("Moisturiser", "Moisturiser"),
        "ALPHA_ARBUTIN": ("Serum", "Serum"),
        "ZINC_PCA": ("Serum", "Serum"),
        "GREEN_TEA_EXTRACT": ("Toner", "Serum"),
        "POLYHYDROXY_ACID": (None, "Serum"),
    }
    return step_map.get(inci_name, ("Serum", "Serum"))


def _build_routine(
    selected_incis: list[str],
    tier: str,
    is_halal_required: bool,
    steps_order: list[str],
    time_of_day: str,
) -> list[RoutineStep]:
    step_buckets: dict[str, list[ProductItem]] = {s: [] for s in steps_order}

    for inci in selected_incis:
        am_step, pm_step = _assign_step(inci)
        target = am_step if time_of_day == "am" else pm_step
        if target and target in step_buckets:
            step_buckets[target].extend(_build_demo_products(inci, tier, is_halal_required))

    instructions = {
        "Cleanser": "Massage onto damp skin for 60 seconds, then rinse thoroughly.",
        "Toner": "Apply with a cotton pad or press gently into skin after cleansing.",
        "Serum": "Apply 2–3 drops to face and neck, press in gently.",
        "Treatment": "Apply a thin layer to affected areas only. Avoid eye area.",
        "Moisturiser": "Apply last to seal in hydration. Neck included.",
        "SPF": "Apply generously as the final AM step. Reapply every 2 hours outdoors.",
    }

    # Always include SPF in AM routine — sunscreen is non-negotiable
    if time_of_day == "am" and not step_buckets.get("SPF"):
        # Biore UV Aqua Rich is halal-certified; include unconditionally
        step_buckets["SPF"] = [
            ProductItem(
                product_name="Biore UV Aqua Rich SPF50+ PA++++",
                brand_name="Biore",
                price_myr=28.0,
                price_tier=tier,
                is_halal=True,
                key_ingredient="SPF_FILTER",
                match_score=1.0,
            )
        ]

    routine: list[RoutineStep] = []
    for i, step_name in enumerate(steps_order, start=1):
        products = step_buckets.get(step_name, [])
        if not products:
            continue
        routine.append(
            RoutineStep(
                step_number=i,
                step_name=step_name,
                instruction=instructions.get(step_name, "Apply as directed."),
                products=products,
            )
        )
    return routine


def _generate_reasoning(
    condition_scores: dict[str, float],
    selected_incis: list[str],
    referral: bool,
) -> str:
    top = sorted(condition_scores.items(), key=lambda x: x[1], reverse=True)[:2]
    conditions_text = " and ".join(f"{c} ({s:.0f}/100)" for c, s in top)
    if referral:
        return (
            f"Your analysis shows {conditions_text}. Due to the severity detected, "
            "we strongly recommend consulting a dermatologist before starting any active "
            "ingredient routine. This is not a medical diagnosis."
        )
    inci_list = ", ".join(selected_incis[:4]) if selected_incis else "gentle hydrators"
    return (
        f"Your analysis shows {conditions_text}. Based on your skin profile, we have "
        f"selected ingredients including {inci_list} to address these concerns. "
        "This is not a medical diagnosis. Consult a dermatologist for clinical concerns."
    )


async def generate_recommendation(
    request: RecommendationRequest,
    condition_scores: dict[str, float],
    user_id: str,
) -> RecommendationResponse:
    """Orchestrate the full recommendation pipeline.

    Args:
        request: Validated recommendation request.
        condition_scores: Dict of condition → severity score from CNN.
        user_id: Supabase auth user ID.

    Returns:
        RecommendationResponse ready to be persisted and returned.
    """
    referral = condition_scores.get("acne", 0) > 80
    if referral:
        rec_id = uuid.uuid4()
        response = RecommendationResponse(
            recommendation_id=rec_id,
            overall_match_score=0.0,
            reasoning_text=_generate_reasoning(condition_scores, [], referral=True),
            am_routine=[],
            pm_routine=[],
            safety_warnings=["Cystic acne detected — active ingredients withheld."],
            referral_note=(
                "Your skin condition may require clinical attention. "
                "Please consult a dermatologist before using active ingredients."
            ),
        )
        try:
            client = await get_supabase()
            await client.table("recommendations").insert({
                "recommendation_id": str(rec_id),
                "analysis_id": str(request.analysis_id),
                "user_id": user_id,
                "algorithm_version": "v1.0",
                "match_score": 0.0,
                "reasoning_text": response.reasoning_text,
                "scoring_breakdown": {
                    "am_routine": [],
                    "pm_routine": [],
                    "safety_warnings": response.safety_warnings,
                    "referral_note": response.referral_note,
                },
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception:
            logger.exception("Failed to persist referral recommendation %s", rec_id)
        return response

    # 1. Select candidates
    candidates = get_candidate_ingredients(
        condition_scores, request.known_skin_type, request.fitzpatrick_scale
    )

    # 2. Score each candidate
    scored: list[tuple[float, str]] = []
    for rule in candidates:
        severity = condition_scores.get(rule.condition, 0)
        score = _score_ingredient(rule, severity, request.fitzpatrick_scale)
        scored.append((score, rule.inci_name))

    scored.sort(reverse=True)
    ordered_incis = [inci for _, inci in scored]

    # 3. Remove allergy exclusions
    allergies_upper = {a.upper() for a in request.known_allergies}
    ordered_incis = [i for i in ordered_incis if i not in allergies_upper]

    # 4. Resolve incompatible pairs
    ordered_incis = resolve_incompatible_pairs(ordered_incis)

    # 5. Deduplicate (keep first occurrence)
    seen: set[str] = set()
    unique_incis: list[str] = []
    for inci in ordered_incis:
        if inci not in seen:
            unique_incis.append(inci)
            seen.add(inci)

    tier = request.price_tier_preference
    is_halal_required = request.is_halal_required

    am = _build_routine(unique_incis, tier, is_halal_required, AM_STEPS, "am")
    pm = _build_routine(unique_incis, tier, is_halal_required, PM_STEPS, "pm")

    overall_score = round(sum(s for s, _ in scored[:5]) / max(len(scored[:5]), 1), 2)
    rec_id = uuid.uuid4()

    response = RecommendationResponse(
        recommendation_id=rec_id,
        overall_match_score=min(overall_score, 1.0),
        reasoning_text=_generate_reasoning(condition_scores, unique_incis, referral=False),
        am_routine=am,
        pm_routine=pm,
        safety_warnings=[],
        referral_note=None,
    )

    # Persist to Supabase
    try:
        client = await get_supabase()
        await client.table("recommendations").insert({
            "recommendation_id": str(rec_id),
            "analysis_id": str(request.analysis_id),
            "user_id": user_id,
            "algorithm_version": "v1.0",
            "match_score": response.overall_match_score,
            "reasoning_text": response.reasoning_text,
            "scoring_breakdown": {
                "scored_ingredients": [{"inci": i, "score": s} for s, i in scored],
                "am_routine": [s.model_dump() for s in am],
                "pm_routine": [s.model_dump() for s in pm],
                "safety_warnings": response.safety_warnings,
                "referral_note": response.referral_note,
            },
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
    except Exception:
        logger.exception("Failed to persist recommendation %s", rec_id)

    return response
