import type { RecommendationResult, UserProfile } from "@/types/recommendation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export async function getRecommendation(
  analysisId: string,
  profile: UserProfile,
  accessToken: string
): Promise<RecommendationResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        analysis_id:          analysisId,
        known_skin_type:      profile.known_skin_type,
        fitzpatrick_scale:    profile.fitzpatrick_scale,
        price_tier_preference: profile.price_tier_preference,
        is_halal_required:    profile.is_halal_required,
        known_allergies:      profile.known_allergies,
      }),
    });
  } catch {
    throw new Error(
      "Could not reach the recommendation server. Make sure the backend is running on port 8000."
    );
  }

  if (!res.ok) {
    let msg = "Could not generate your routine. Please try again.";
    try {
      const body = await res.json() as { detail?: string };
      if (body.detail) msg = body.detail;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<RecommendationResult>;
}
