"""Tests for the recommendation engine and ingredient rules."""
import pytest

from services.ingredient_rules import get_candidate_ingredients, resolve_incompatible_pairs
from services.recommender import _score_ingredient, _generate_reasoning


class TestIngredientSelection:
    """Tests for get_candidate_ingredients()."""

    def test_oily_acne_selects_salicylic_acid(self):
        scores = {"acne": 50.0}
        candidates = get_candidate_ingredients(scores, "oily", fitzpatrick=3)
        inci_names = [r.inci_name for r in candidates]
        assert "SALICYLIC_ACID" in inci_names

    def test_below_severity_threshold_excluded(self):
        scores = {"acne": 5.0}  # below min_severity=30 for salicylic acid
        candidates = get_candidate_ingredients(scores, "oily", fitzpatrick=3)
        inci_names = [r.inci_name for r in candidates]
        assert "SALICYLIC_ACID" not in inci_names

    def test_wrong_skin_type_excluded(self):
        scores = {"oiliness": 60.0}
        candidates = get_candidate_ingredients(scores, "dry", fitzpatrick=3)
        inci_names = [r.inci_name for r in candidates]
        assert "SALICYLIC_ACID" not in inci_names

    def test_niacinamide_selected_for_multiple_conditions(self):
        scores = {"acne": 40.0, "oiliness": 35.0, "redness": 30.0}
        candidates = get_candidate_ingredients(scores, "oily", fitzpatrick=3)
        inci_names = [r.inci_name for r in candidates]
        assert "NIACINAMIDE" in inci_names

    def test_empty_scores_returns_no_candidates(self):
        candidates = get_candidate_ingredients({}, "oily", fitzpatrick=3)
        assert candidates == []


class TestIncompatiblePairs:
    """Tests for resolve_incompatible_pairs()."""

    def test_retinol_and_glycolic_acid_not_both_kept(self):
        selected = ["RETINOL", "GLYCOLIC_ACID", "NIACINAMIDE"]
        result = resolve_incompatible_pairs(selected)
        assert not ("RETINOL" in result and "GLYCOLIC_ACID" in result)

    def test_higher_priority_ingredient_kept(self):
        selected = ["RETINOL", "GLYCOLIC_ACID"]
        result = resolve_incompatible_pairs(selected)
        assert result[0] == "RETINOL"  # first-listed (higher score) is kept

    def test_compatible_ingredients_all_kept(self):
        selected = ["NIACINAMIDE", "HYALURONIC_ACID", "CERAMIDE_NP"]
        result = resolve_incompatible_pairs(selected)
        assert result == selected

    def test_empty_list_returns_empty(self):
        assert resolve_incompatible_pairs([]) == []


class TestIngredientScoring:
    """Tests for _score_ingredient()."""

    def test_score_between_zero_and_one(self):
        from services.ingredient_rules import INGREDIENT_RULES
        rule = next(r for r in INGREDIENT_RULES if r.inci_name == "SALICYLIC_ACID" and r.condition == "acne")
        score = _score_ingredient(rule, severity_score=60.0, fitzpatrick=3)
        assert 0.0 <= score <= 1.0

    def test_fitzpatrick_demotion_reduces_score(self):
        from services.ingredient_rules import INGREDIENT_RULES
        rule = next(r for r in INGREDIENT_RULES if r.inci_name == "RETINOL" and r.condition == "acne")
        score_low = _score_ingredient(rule, severity_score=60.0, fitzpatrick=2)
        score_high = _score_ingredient(rule, severity_score=60.0, fitzpatrick=5)
        assert score_high < score_low

    def test_higher_severity_gives_higher_score(self):
        from services.ingredient_rules import INGREDIENT_RULES
        rule = next(r for r in INGREDIENT_RULES if r.inci_name == "SALICYLIC_ACID" and r.condition == "acne")
        low = _score_ingredient(rule, severity_score=30.0, fitzpatrick=3)
        high = _score_ingredient(rule, severity_score=80.0, fitzpatrick=3)
        assert high > low


class TestCysticAcneReferral:
    """Cystic acne must return referral, no actives."""

    def test_high_acne_score_triggers_referral_text(self):
        scores = {"acne": 85.0}
        text = _generate_reasoning(scores, [], referral=True)
        assert "dermatologist" in text.lower()

    def test_referral_reasoning_includes_disclaimer(self):
        scores = {"acne": 85.0}
        text = _generate_reasoning(scores, [], referral=True)
        assert "not a medical diagnosis" in text.lower()
