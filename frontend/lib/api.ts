import type { AnalysisResult, RecommendationResult, RecommendRequest } from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api/v1";

// ─── Demo data ────────────────────────────────────────────────────────────────
// Used when NEXT_PUBLIC_BACKEND_URL is not set or the backend is unreachable.

export const DEMO_ANALYSIS: AnalysisResult = {
  analysis_id: "demo-analysis-001",
  overall_health_score: 74,
  skin_health_label: "Good",
  model_version: "v1.0.0",
  model_confidence: 0.87,
  inference_duration_ms: 1240,
  image_quality: {
    quality_score: 0.82,
    face_detected: true,
    lighting_assessment: "good",
    passed_quality_gate: true,
  },
  conditions: [
    { condition_type: "acne", severity_label: "moderate", severity_score: 55, acne_subtype: "inflammatory", acne_lesion_count: 11, affected_zones: ["t_zone", "chin"] },
    { condition_type: "oiliness", severity_label: "mild", severity_score: 38, sebum_production: "high", oily_zones: ["t_zone", "forehead"] },
    { condition_type: "dryness", severity_label: "none", severity_score: 12 },
    { condition_type: "pigmentation", severity_label: "mild", severity_score: 28 },
    { condition_type: "texture", severity_label: "mild", severity_score: 32 },
    { condition_type: "sensitivity", severity_label: "none", severity_score: 15 },
    { condition_type: "redness", severity_label: "none", severity_score: 18 },
  ],
  referral_recommended: false,
  analysed_at: new Date().toISOString(),
};

export const DEMO_RECOMMENDATION: RecommendationResult = {
  recommendation_id: "demo-rec-001",
  overall_match_score: 0.84,
  reasoning_text:
    "Your analysis shows moderate inflammatory acne concentrated in the T-zone and chin, paired with mild oiliness and slight post-inflammatory pigmentation. We have prioritised non-comedogenic, oil-controlling actives (Niacinamide, Salicylic Acid) for daytime, and a gentle BHA exfoliant plus targeted retinol in the evening to accelerate cell turnover and fade dark spots. All recommended products are halal-certified and within your budget tier.",
  am_routine: [
    {
      step_number: 1,
      step_name: "Cleanser",
      instruction: "Wet your face with lukewarm water. Massage gently in circular motions for 60 seconds, then rinse thoroughly. Pat dry — never rub.",
      products: [
        { product_name: "Foaming Facial Cleanser", brand_name: "CeraVe", price_myr: 45.00, price_tier: "mid", is_halal: true, key_ingredient: "NIACINAMIDE", match_score: 0.91 },
        { product_name: "Daily Facial Cleanser", brand_name: "Cetaphil", price_myr: 28.90, price_tier: "budget", is_halal: true, key_ingredient: "GLYCERIN", match_score: 0.85 },
      ],
    },
    {
      step_number: 2,
      step_name: "Toner",
      instruction: "Apply to a cotton pad and sweep gently across the face, avoiding the eye area. Allow 30 seconds to absorb before the next step.",
      products: [
        { product_name: "AHA·BHA·PHA 30 Days Miracle Toner", brand_name: "Some By Mi", price_myr: 38.00, price_tier: "budget", is_halal: true, key_ingredient: "SALICYLIC ACID", match_score: 0.88 },
      ],
    },
    {
      step_number: 3,
      step_name: "Serum",
      instruction: "Dispense 3–4 drops onto fingertips and press gently into skin. Focus on acne-prone and pigmented areas. Let absorb for 60 seconds.",
      products: [
        { product_name: "Niacinamide 10% + Zinc 1%", brand_name: "The Ordinary", price_myr: 29.00, price_tier: "budget", is_halal: false, key_ingredient: "NIACINAMIDE", match_score: 0.93 },
        { product_name: "B5 Hydration Serum", brand_name: "Some By Mi", price_myr: 55.00, price_tier: "mid", is_halal: true, key_ingredient: "PANTHENOL", match_score: 0.80 },
      ],
    },
    {
      step_number: 4,
      step_name: "Moisturiser",
      instruction: "Apply a pea-sized amount evenly across the face and neck. Use upward, outward strokes. Wait 2 minutes before sunscreen.",
      products: [
        { product_name: "Hydro Boost Water Gel", brand_name: "Neutrogena", price_myr: 62.00, price_tier: "mid", is_halal: false, key_ingredient: "HYALURONIC ACID", match_score: 0.87 },
        { product_name: "Oil-Free Moisturiser", brand_name: "Cetaphil", price_myr: 35.00, price_tier: "budget", is_halal: true, key_ingredient: "GLYCERIN", match_score: 0.82 },
      ],
    },
    {
      step_number: 5,
      step_name: "Sunscreen (SPF 50+)",
      instruction: "Apply generously as the final step — at least ¼ teaspoon for the face. Reapply every 2 hours when outdoors.",
      products: [
        { product_name: "UV Aqua Rich Watery Essence SPF 50+", brand_name: "Biore", price_myr: 32.00, price_tier: "budget", is_halal: false, key_ingredient: "UVINUL A PLUS", match_score: 0.90 },
        { product_name: "Anthelios Invisible Fluid SPF 50+", brand_name: "La Roche-Posay", price_myr: 89.00, price_tier: "premium", is_halal: false, key_ingredient: "MEXORYL SX", match_score: 0.86 },
      ],
    },
  ],
  pm_routine: [
    {
      step_number: 1,
      step_name: "Makeup Remover / Micellar Water",
      instruction: "Soak a cotton pad and press over closed eyes for 10 seconds. Gently wipe away without rubbing. Follow with your cleanser.",
      products: [
        { product_name: "Sensibio H2O Micellar Water", brand_name: "Bioderma", price_myr: 42.00, price_tier: "mid", is_halal: true, key_ingredient: "CUCURBIT PEPO", match_score: 0.89 },
      ],
    },
    {
      step_number: 2,
      step_name: "Cleanser",
      instruction: "Double cleanse at night. Use this gentle cleanser after micellar water to ensure all residue is removed.",
      products: [
        { product_name: "Gentle Skin Cleanser", brand_name: "Simple", price_myr: 18.90, price_tier: "budget", is_halal: true, key_ingredient: "PRO-VITAMIN B5", match_score: 0.84 },
        { product_name: "Foaming Facial Cleanser", brand_name: "CeraVe", price_myr: 45.00, price_tier: "mid", is_halal: true, key_ingredient: "CERAMIDES", match_score: 0.88 },
      ],
    },
    {
      step_number: 3,
      step_name: "Exfoliating Toner (2–3× weekly)",
      instruction: "Apply on non-retinol nights only. Do not use with the PM treatment serum on the same night.",
      products: [
        { product_name: "AHA 7 Whitehead Power Liquid", brand_name: "COSRX", price_myr: 48.00, price_tier: "mid", is_halal: false, key_ingredient: "GLYCOLIC ACID", match_score: 0.86 },
      ],
    },
    {
      step_number: 4,
      step_name: "Treatment Serum",
      instruction: "Apply 2–3 drops to the entire face. Start with once weekly and increase gradually. Do not layer with AHA/BHA on the same night.",
      products: [
        { product_name: "Granactive Retinoid 2% Emulsion", brand_name: "The Ordinary", price_myr: 42.00, price_tier: "budget", is_halal: false, key_ingredient: "RETINOID", match_score: 0.91 },
      ],
    },
    {
      step_number: 5,
      step_name: "Spot Treatment",
      instruction: "Apply a thin layer directly onto active blemishes only. Do not spread to surrounding skin. Use after serum, before moisturiser.",
      products: [
        { product_name: "AC Collection Blemish Spot Drying Lotion", brand_name: "Mario Badescu", price_myr: 55.00, price_tier: "mid", is_halal: false, key_ingredient: "SALICYLIC ACID", match_score: 0.88 },
        { product_name: "Acne-Aid Spot Gel", brand_name: "Acne-Aid", price_myr: 22.00, price_tier: "budget", is_halal: true, key_ingredient: "TRICLOSAN", match_score: 0.80 },
      ],
    },
    {
      step_number: 6,
      step_name: "Night Moisturiser",
      instruction: "Apply a generous layer as the final step. The heavier texture is intentional — night moisturisers work with your skin's natural repair cycle.",
      products: [
        { product_name: "PM Facial Moisturising Lotion", brand_name: "CeraVe", price_myr: 52.00, price_tier: "mid", is_halal: true, key_ingredient: "CERAMIDES", match_score: 0.90 },
        { product_name: "Cicaplast Baume B5+", brand_name: "La Roche-Posay", price_myr: 72.00, price_tier: "mid", is_halal: false, key_ingredient: "MADECASSOSIDE", match_score: 0.85 },
      ],
    },
  ],
  safety_warnings: [
    "Do not use Retinoid and Glycolic Acid on the same night — alternate instead.",
    "Always apply sunscreen as the final morning step. Skipping SPF while using BHA/AHA will worsen pigmentation.",
  ],
  referral_note: null,
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function analyzeImage(
  file: File,
  token: string
): Promise<AnalysisResult> {
  if (!process.env.NEXT_PUBLIC_BACKEND_URL) return DEMO_ANALYSIS;

  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Analysis failed");
  }
  return res.json() as Promise<AnalysisResult>;
}

export async function getRecommendation(
  payload: RecommendRequest,
  token: string
): Promise<RecommendationResult> {
  if (!process.env.NEXT_PUBLIC_BACKEND_URL) return DEMO_RECOMMENDATION;

  const res = await fetch(`${BACKEND_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Recommendation failed");
  }
  return res.json() as Promise<RecommendationResult>;
}
