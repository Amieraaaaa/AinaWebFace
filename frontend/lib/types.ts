// ─── Analysis ────────────────────────────────────────────────────────────────

export interface ImageQuality {
  quality_score: number;
  face_detected: boolean;
  lighting_assessment: string;
  passed_quality_gate: boolean;
}

export interface SkinConditionResult {
  condition_type: string;
  severity_label: "none" | "mild" | "moderate" | "severe";
  severity_score: number;
  acne_subtype?: "comedonal" | "inflammatory" | "cystic";
  acne_lesion_count?: number;
  affected_zones?: string[];
  sebum_production?: string;
  oily_zones?: string[];
}

export interface AnalysisResult {
  analysis_id: string;
  overall_health_score: number;
  skin_health_label: string;
  model_version: string;
  model_confidence: number;
  inference_duration_ms: number;
  image_quality: ImageQuality;
  conditions: SkinConditionResult[];
  referral_recommended: boolean;
  analysed_at: string;
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export type PriceTier = "budget" | "mid" | "premium";

export interface Product {
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
  products: Product[];
}

export interface RecommendationResult {
  recommendation_id: string;
  overall_match_score: number;
  reasoning_text: string;
  am_routine: RoutineStep[];
  pm_routine: RoutineStep[];
  safety_warnings: string[];
  referral_note: string | null;
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface RecommendRequest {
  analysis_id: string;
  known_skin_type: "oily" | "dry" | "combination" | "normal" | "sensitive";
  fitzpatrick_scale: number;
  price_tier_preference: PriceTier;
  is_halal_required: boolean;
  known_allergies: string[];
}
