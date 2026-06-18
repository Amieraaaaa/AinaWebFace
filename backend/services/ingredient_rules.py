"""Clinical ingredient rules for the SkinSight recommendation engine.

Each entry maps a skin condition → severity threshold → list of INCI ingredient names.
Rules are research-backed (see PRD Section 6.4).

Fitzpatrick adjustments demote retinoids and AHAs for types IV–VI.
Incompatible pairs are never recommended together in the same routine.
"""

from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class IngredientRule:
    inci_name: str
    condition: str
    min_severity: float          # minimum severity score (0–100) to activate
    strength_score: float        # 0–1 clinical strength rating
    evidence_score: float        # 0–1 evidence quality (RCT > case study)
    skin_type_match: list[str]   # oily | dry | combination | normal | sensitive
    fitzpatrick_demotion: list[int] = field(default_factory=list)  # types to demote


# ---------------------------------------------------------------------------
# Master rule table
# ---------------------------------------------------------------------------

INGREDIENT_RULES: list[IngredientRule] = [
    # --- Acne ---
    IngredientRule("SALICYLIC_ACID", "acne", 30, 0.85, 0.90, ["oily", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("BENZOYL_PEROXIDE", "acne", 45, 0.90, 0.92, ["oily", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("NIACINAMIDE", "acne", 20, 0.70, 0.85, ["oily", "dry", "combination", "normal", "sensitive"], fitzpatrick_demotion=[]),
    IngredientRule("AZELAIC_ACID", "acne", 25, 0.75, 0.80, ["oily", "combination", "sensitive"], fitzpatrick_demotion=[]),
    IngredientRule("RETINOL", "acne", 40, 0.88, 0.88, ["oily", "combination"], fitzpatrick_demotion=[4, 5, 6]),

    # --- Dryness ---
    IngredientRule("HYALURONIC_ACID", "dryness", 10, 0.80, 0.88, ["dry", "combination", "normal", "sensitive"], fitzpatrick_demotion=[]),
    IngredientRule("CERAMIDE_NP", "dryness", 15, 0.85, 0.90, ["dry", "sensitive"], fitzpatrick_demotion=[]),
    IngredientRule("GLYCERIN", "dryness", 10, 0.75, 0.85, ["dry", "combination", "normal", "sensitive"], fitzpatrick_demotion=[]),
    IngredientRule("SQUALANE", "dryness", 20, 0.78, 0.82, ["dry", "normal"], fitzpatrick_demotion=[]),

    # --- Oiliness ---
    IngredientRule("NIACINAMIDE", "oiliness", 20, 0.72, 0.85, ["oily", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("SALICYLIC_ACID", "oiliness", 25, 0.80, 0.88, ["oily", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("ZINC_PCA", "oiliness", 20, 0.70, 0.78, ["oily", "combination"], fitzpatrick_demotion=[]),

    # --- Pigmentation ---
    IngredientRule("VITAMIN_C", "pigmentation", 25, 0.82, 0.88, ["dry", "combination", "normal"], fitzpatrick_demotion=[]),
    IngredientRule("NIACINAMIDE", "pigmentation", 20, 0.78, 0.85, ["oily", "dry", "combination", "normal", "sensitive"], fitzpatrick_demotion=[]),
    IngredientRule("AZELAIC_ACID", "pigmentation", 20, 0.75, 0.82, ["sensitive", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("ALPHA_ARBUTIN", "pigmentation", 15, 0.70, 0.78, ["dry", "combination", "normal"], fitzpatrick_demotion=[]),
    IngredientRule("GLYCOLIC_ACID", "pigmentation", 30, 0.80, 0.85, ["oily", "combination"], fitzpatrick_demotion=[4, 5, 6]),

    # --- Texture ---
    IngredientRule("GLYCOLIC_ACID", "texture", 25, 0.82, 0.87, ["oily", "combination"], fitzpatrick_demotion=[4, 5, 6]),
    IngredientRule("LACTIC_ACID", "texture", 20, 0.75, 0.82, ["dry", "combination", "sensitive"], fitzpatrick_demotion=[5, 6]),
    IngredientRule("RETINOL", "texture", 35, 0.88, 0.90, ["oily", "combination", "normal"], fitzpatrick_demotion=[4, 5, 6]),
    IngredientRule("POLYHYDROXY_ACID", "texture", 15, 0.65, 0.75, ["sensitive", "dry"], fitzpatrick_demotion=[]),

    # --- Sensitivity ---
    IngredientRule("CENTELLA_ASIATICA", "sensitivity", 15, 0.72, 0.80, ["sensitive", "dry", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("PANTHENOL", "sensitivity", 10, 0.70, 0.78, ["sensitive", "dry"], fitzpatrick_demotion=[]),
    IngredientRule("ALLANTOIN", "sensitivity", 10, 0.68, 0.75, ["sensitive", "dry", "combination"], fitzpatrick_demotion=[]),

    # --- Redness ---
    IngredientRule("AZELAIC_ACID", "redness", 20, 0.78, 0.82, ["sensitive", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("NIACINAMIDE", "redness", 15, 0.72, 0.80, ["oily", "sensitive", "combination"], fitzpatrick_demotion=[]),
    IngredientRule("CENTELLA_ASIATICA", "redness", 15, 0.70, 0.78, ["sensitive", "dry"], fitzpatrick_demotion=[]),
    IngredientRule("GREEN_TEA_EXTRACT", "redness", 10, 0.65, 0.72, ["sensitive", "dry", "combination"], fitzpatrick_demotion=[]),
]

# ---------------------------------------------------------------------------
# Incompatible pairs — never recommend both in the same routine
# ---------------------------------------------------------------------------

INCOMPATIBLE_PAIRS: list[frozenset] = [
    frozenset({"RETINOL", "GLYCOLIC_ACID"}),
    frozenset({"RETINOL", "LACTIC_ACID"}),
    frozenset({"RETINOL", "SALICYLIC_ACID"}),
    frozenset({"VITAMIN_C", "GLYCOLIC_ACID"}),
    frozenset({"VITAMIN_C", "NIACINAMIDE"}),
    frozenset({"BENZOYL_PEROXIDE", "RETINOL"}),
    frozenset({"BENZOYL_PEROXIDE", "VITAMIN_C"}),
]

# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def get_candidate_ingredients(
    condition_scores: dict[str, float],
    skin_type: str,
    fitzpatrick: int,
) -> list[IngredientRule]:
    """Return scored ingredient rules that pass severity and skin-type filters.

    Args:
        condition_scores: Dict of condition_type → severity score (0–100).
        skin_type: User's self-reported skin type.
        fitzpatrick: Fitzpatrick scale 1–6.

    Returns:
        Filtered list of IngredientRule objects.
    """
    candidates: list[IngredientRule] = []
    for rule in INGREDIENT_RULES:
        score = condition_scores.get(rule.condition, 0)
        if score < rule.min_severity:
            continue
        if skin_type not in rule.skin_type_match:
            continue
        candidates.append(rule)
    return candidates


def resolve_incompatible_pairs(selected: list[str]) -> list[str]:
    """Remove the lower-priority ingredient from any incompatible pair.

    Args:
        selected: Ordered list of INCI names (highest score first).

    Returns:
        Filtered list with no incompatible pairs remaining.
    """
    kept: list[str] = []
    kept_set: set[str] = set()
    for inci in selected:
        conflict = any(
            inci in pair and (pair - {inci}) & kept_set
            for pair in INCOMPATIBLE_PAIRS
        )
        if not conflict:
            kept.append(inci)
            kept_set.add(inci)
    return kept
