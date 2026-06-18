// Mirrors backend/models/schemas.py exactly

export type ConditionType =
  | "acne"
  | "dryness"
  | "oiliness"
  | "pigmentation"
  | "texture"
  | "sensitivity"
  | "redness";

export type SeverityLabel = "none" | "mild" | "moderate" | "severe";
export type AcneSubtype   = "comedonal" | "inflammatory" | "cystic";

export interface ImageQualityReport {
  quality_score: number;
  face_detected: boolean;
  lighting_assessment: string; // "good" | "poor" | "dark" | "bright"
  passed_quality_gate: boolean;
}

export interface ConditionResult {
  condition_type: ConditionType;
  severity_label: SeverityLabel;
  severity_score: number;          // 0–100
  acne_subtype?: AcneSubtype | null;
  acne_lesion_count?: number | null;
  affected_zones?: string[] | null;
  sebum_production?: string | null; // "low" | "normal" | "high"
  oily_zones?: string[] | null;
}

export interface AnalysisResponse {
  analysis_id: string;             // UUID serialised as string
  overall_health_score: number;
  skin_health_label: string;       // "Poor" | "Fair" | "Good" | "Excellent"
  model_version: string;
  model_confidence: number;
  inference_duration_ms: number;
  image_quality: ImageQualityReport;
  conditions: ConditionResult[];
  referral_recommended: boolean;
  analysed_at: string;             // ISO datetime string
}

export interface PredictResponse {
  condition: string;    // e.g. "Acne"
  confidence: string;   // e.g. "87.3%"
  severity: string;     // "None" | "Mild" | "Moderate" | "Severe"
  description: string;
}
