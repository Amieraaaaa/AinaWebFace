import type { AnalysisResponse, PredictResponse } from "@/types/analysis";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class AnalysisError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AnalysisError";
  }
}

// Maps backend error codes → student-friendly messages (Design.md §9)
const ERROR_MESSAGES: Record<string, string> = {
  NO_FACE_DETECTED:      "We could not detect a face in your photo. Please make sure your face is clearly visible and try again.",
  IMAGE_TOO_BLURRY:      "Your photo is a little blurry. Hold the camera steady and try again.",
  POOR_LIGHTING:         "Your photo is a bit too dark. Try moving closer to a window or turning on a brighter light, then retake the photo.",
  IMAGE_QUALITY_TOO_LOW: "Your photo quality needs a bit of work. Check the tips below and retry.",
  FILE_TOO_LARGE:        "Your photo is over 10 MB. Try compressing it or taking a new photo directly with the camera.",
  UNSUPPORTED_FORMAT:    "Please upload a JPEG, PNG, or WEBP photo.",
  INTERNAL_ERROR:        "Something went wrong on our end. Please try again in a moment.",
};

export async function analyzeImage(
  file: File,
  accessToken: string
): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/analyze/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
  } catch {
    throw new Error(
      "Could not reach the analysis server. Make sure the backend is running on port 8000."
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Your session has expired. Please sign out and sign in again.");
    }
    let code = "INTERNAL_ERROR";
    try {
      const body = await res.json() as { code?: string; error?: string; detail?: { code?: string; error?: string } | string };
      const nested = typeof body.detail === "object" ? body.detail : null;
      code = body.code ?? body.error ?? nested?.code ?? nested?.error ?? "INTERNAL_ERROR";
    } catch { /* ignore parse failure */ }
    throw new AnalysisError(code, ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_ERROR);
  }

  return res.json() as Promise<AnalysisResponse>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string); // includes data URI prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function predictDefect(
  file: File,
  accessToken: string
): Promise<PredictResponse> {
  const base64 = await fileToBase64(file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/analyze/predict`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64 }),
    });
  } catch {
    throw new Error("Could not reach the analysis server for defect detection.");
  }

  if (!res.ok) {
    throw new Error("Skin defect detection failed. The main analysis result is still available.");
  }

  return res.json() as Promise<PredictResponse>;
}
