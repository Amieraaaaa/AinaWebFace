// Mirrors backend/models/schemas.py exactly

export type PriceTier = "budget" | "mid" | "premium";
export type SkinType  = "oily" | "dry" | "combination" | "normal" | "sensitive";

export interface RecommendedProduct {
  product_name: string;
  brand_name: string;
  price_myr: number;
  price_tier: PriceTier;
  is_halal: boolean;
  key_ingredient: string;
  match_score: number;
}

export interface RoutineStep {
  step_number: number;
  step_name: string;
  instruction: string;
  products: RecommendedProduct[];
}

export interface RecommendationResult {
  recommendation_id: string;  // UUID serialised as string
  overall_match_score: number;
  reasoning_text: string;
  am_routine: RoutineStep[];
  pm_routine: RoutineStep[];
  safety_warnings: string[];
  referral_note: string | null;
}

// What we send to POST /recommend, and what the scan page assembles from profile
export interface UserProfile {
  known_skin_type: SkinType;
  fitzpatrick_scale: number;        // 1–6
  price_tier_preference: PriceTier;
  is_halal_required: boolean;
  known_allergies: string[];
}
