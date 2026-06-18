"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useSession } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/client";
import { analyzeImage, predictDefect, AnalysisError } from "@/lib/api/analyze";
import { getRecommendation } from "@/lib/api/recommend";
import type { UserProfile } from "@/types/recommendation";

// ─── Acne zone landmark indices (MediaPipe 468-point face mesh) ───────────────
// Covers forehead, left cheek, right cheek, and chin — typical acne-prone areas.
const ACNE_ZONE_INDICES = new Set<number>([
  // forehead
  10, 67, 69, 104, 108, 109, 151, 338, 297, 332, 284, 251, 389, 54,
  // left cheek
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 177, 215, 138, 135,
  // right cheek
  454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 435, 364, 430, 394,
  // chin
  152, 175, 171, 199, 200, 169, 170, 140, 32, 262,
]);

// ─── Landmark dot drawing helper ─────────────────────────────────────────────
interface NormalizedLandmark { x: number; y: number; z: number; }

function drawDots(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  showAcne: boolean,
  acne: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  landmarks.forEach((lm, i) => {
    const x = lm.x * canvas.width;
    const y = lm.y * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle =
      showAcne && acne && ACNE_ZONE_INDICES.has(i)
        ? "rgba(220, 38, 38, 0.85)"    // red — acne zone
        : "rgba(227, 106, 106, 0.55)"; // coral — normal
    ctx.fill();
  });
}

// ─── Quality Feedback UI ──────────────────────────────────────────────────────

const QUALITY_CONFIG: Record<string, {
  icon: string; color: string; bgColor: string; borderColor: string;
  title: string; tip: string;
}> = {
  NO_FACE_DETECTED: {
    icon: "face_retouching_off", color: "text-orange-600",
    bgColor: "bg-orange-50", borderColor: "border-orange-200",
    title: "No Face Detected",
    tip: "Centre your face in the frame and keep your full face visible.",
  },
  IMAGE_TOO_BLURRY: {
    icon: "blur_on", color: "text-yellow-600",
    bgColor: "bg-yellow-50", borderColor: "border-yellow-200",
    title: "Photo is Too Blurry",
    tip: "Rest your elbow on a surface or tap the screen to focus before capturing.",
  },
  POOR_LIGHTING: {
    icon: "light_mode", color: "text-amber-600",
    bgColor: "bg-amber-50", borderColor: "border-amber-200",
    title: "Poor Lighting",
    tip: "Face a window or bright lamp directly. Avoid standing with a light source behind you.",
  },
  IMAGE_QUALITY_TOO_LOW: {
    icon: "image_not_supported", color: "text-red-600",
    bgColor: "bg-red-50", borderColor: "border-red-200",
    title: "Image Quality Too Low",
    tip: "Good lighting + steady camera + face centred in frame = a passing scan.",
  },
  FILE_TOO_LARGE: {
    icon: "upload_file", color: "text-red-600",
    bgColor: "bg-red-50", borderColor: "border-red-200",
    title: "File Too Large",
    tip: "Photos taken directly with your phone camera app are usually within the size limit.",
  },
  UNSUPPORTED_FORMAT: {
    icon: "broken_image", color: "text-red-600",
    bgColor: "bg-red-50", borderColor: "border-red-200",
    title: "Unsupported File Type",
    tip: "Save your image as .jpg or .png and try again.",
  },
};

const QUALITY_CHECKS = [
  { id: "NO_FACE_DETECTED", icon: "face",       label: "Face visible",     order: 0 },
  { id: "POOR_LIGHTING",    icon: "light_mode",  label: "Good lighting",    order: 1 },
  { id: "IMAGE_TOO_BLURRY", icon: "blur_off",    label: "Sharp & in focus", order: 2 },
];

function QualityFeedback({ code, message, onDismiss }: {
  code: string; message: string; onDismiss: () => void;
}) {
  const cfg = QUALITY_CONFIG[code];

  if (!cfg) {
    return (
      <div className="mb-6 flex items-start gap-3 p-4 bg-error-container rounded-2xl">
        <span className="material-symbols-outlined text-error text-[20px] mt-0.5 shrink-0">error</span>
        <div className="flex-1">
          <p className="font-headline font-bold text-on-error-container text-sm mb-1">Analysis failed</p>
          <p className="text-on-error-container text-sm leading-relaxed">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-on-error-container/60 hover:text-on-error-container">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    );
  }

  const failedOrder = QUALITY_CHECKS.find(c => c.id === code)?.order ?? -1;

  return (
    <div className={`mb-6 rounded-2xl border-2 p-5 ${cfg.bgColor} ${cfg.borderColor}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60">
          <span className={`material-symbols-outlined text-xl ${cfg.color}`}>{cfg.icon}</span>
        </div>
        <div className="flex-1">
          <p className={`font-headline font-bold text-base mb-1 ${cfg.color}`}>{cfg.title}</p>
          <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-on-surface-variant/50 hover:text-on-surface-variant shrink-0">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {QUALITY_CHECKS.map(({ id, icon, label, order }) => {
          const isFailing = id === code;
          const passed = !isFailing && order < failedOrder;
          const allPassed = code === "IMAGE_QUALITY_TOO_LOW";
          const chipStyle = isFailing
            ? "bg-red-100 text-red-700"
            : (passed || allPassed)
            ? "bg-green-100 text-green-700"
            : "bg-white/60 text-on-surface-variant";
          const chipIcon = isFailing ? "cancel" : (passed || allPassed) ? "check_circle" : "help";
          return (
            <span key={id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${chipStyle}`}>
              <span className="material-symbols-outlined text-[13px]">{chipIcon}</span>
              {label}
            </span>
          );
        })}
      </div>

      <div className="flex items-start gap-2 pt-3 border-t border-black/5">
        <span className="material-symbols-outlined text-[15px] text-on-surface-variant shrink-0 mt-0.5">lightbulb</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold">Tip:</span> {cfg.tip}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type Status =
  | "requesting"
  | "live"
  | "captured"
  | "scanning"
  | "denied"
  | "unsupported"
  | "error";

export default function ScanPage() {
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef          = useRef<HTMLInputElement>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const capturedFile     = useRef<File | null>(null);
  // MediaPipe refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef    = useRef<any>(null);
  const animFrameRef     = useRef<number>(0);
  const lastLandmarksRef = useRef<NormalizedLandmark[]>([]);

  const [status,       setStatus]       = useState<Status>("requesting");
  const [snapshot,     setSnapshot]     = useState<string | null>(null);
  const [facingMode,   setFacingMode]   = useState<"user" | "environment">("user");
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
  const [errorCode,    setErrorCode]    = useState<string | null>(null);
  const [acneDetected, setAcneDetected] = useState(false);

  const router = useRouter();
  const { session, user } = useSession();

  // ── Draw loop ────────────────────────────────────────────────────────────────
  const startDrawLoop = useCallback(() => {
    const loop = () => {
      const video      = videoRef.current;
      const canvas     = overlayCanvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      // Sync canvas resolution to its displayed size
      const rect = canvas.getBoundingClientRect();
      if (canvas.width  !== rect.width)  canvas.width  = rect.width;
      if (canvas.height !== rect.height) canvas.height = rect.height;

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const lms = result.faceLandmarks?.[0];
        if (lms) {
          lastLandmarksRef.current = lms;
          drawDots(canvas, lms, false, false);
        } else {
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch {
        // silently ignore detection errors mid-loop
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Init MediaPipe FaceLandmarker ────────────────────────────────────────────
  const initLandmarker = useCallback(async () => {
    // Reuse existing instance across retakes
    if (landmarkerRef.current) {
      startDrawLoop();
      return;
    }
    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      startDrawLoop();
    } catch {
      // MediaPipe failed to load — feature degrades gracefully, scan still works
    }
  }, [startDrawLoop]);

  // ── Watch status to start/stop the draw loop ─────────────────────────────────
  useEffect(() => {
    if (status === "live") {
      initLandmarker();
    }
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [status, initLandmarker]);

  // ── Start camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode: "user" | "environment") => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setSnapshot(null);
    capturedFile.current = null;
    setErrorMsg(null);
    setStatus("requesting");

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Flip camera ──────────────────────────────────────────────────────────────
  const flipCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  // ── Capture frame ────────────────────────────────────────────────────────────
  const captureFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
      capturedFile.current = file;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string")
          localStorage.setItem("skinsight_captured_image", reader.result);
      };
      reader.readAsDataURL(file);

      // Stop camera + RAF, then freeze last landmarks on overlay
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animFrameRef.current);
      const overlay = overlayCanvasRef.current;
      if (overlay && lastLandmarksRef.current.length > 0) {
        // Sync size before drawing frozen frame
        const rect = overlay.getBoundingClientRect();
        overlay.width  = rect.width  || overlay.width;
        overlay.height = rect.height || overlay.height;
        drawDots(overlay, lastLandmarksRef.current, false, false);
      }

      setSnapshot(URL.createObjectURL(file));
      setStatus("captured");
    }, "image/jpeg", 0.92);
  };

  // ── File upload fallback ──────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(animFrameRef.current);
    capturedFile.current = file;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string")
        localStorage.setItem("skinsight_captured_image", reader.result);
    };
    reader.readAsDataURL(file);
    setSnapshot(URL.createObjectURL(file));
    setErrorMsg(null);
    setStatus("captured");
  };

  // ── Retake ───────────────────────────────────────────────────────────────────
  const retake = () => {
    cancelAnimationFrame(animFrameRef.current);
    // Clear overlay canvas
    const overlay = overlayCanvasRef.current;
    if (overlay) overlay.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
    lastLandmarksRef.current = [];
    capturedFile.current = null;
    setSnapshot(null);
    setErrorMsg(null);
    setErrorCode(null);
    setAcneDetected(false);
    startCamera(facingMode);
  };

  // ── Analyse ───────────────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    const file = capturedFile.current;
    if (!file || status !== "captured") return;

    if (!session?.access_token || !user) {
      setErrorMsg("You need to be signed in to analyse. Please sign in and try again.");
      return;
    }

    setStatus("scanning");
    setErrorMsg(null);

    try {
      const [analysisResult, predictResult] = await Promise.allSettled([
        analyzeImage(file, session.access_token),
        predictDefect(file, session.access_token),
      ]);

      if (analysisResult.status === "rejected") throw analysisResult.reason;

      const analysis = analysisResult.value;
      sessionStorage.setItem("skinsight_analysis", JSON.stringify(analysis));
      localStorage.setItem("skinsight_analysis", JSON.stringify(analysis));

      if (predictResult.status === "fulfilled") {
        sessionStorage.setItem("skinsight_predict", JSON.stringify(predictResult.value));
        localStorage.setItem("skinsight_predict", JSON.stringify(predictResult.value));
      } else {
        sessionStorage.removeItem("skinsight_predict");
        localStorage.removeItem("skinsight_predict");
      }

      const supabase = createClient();
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("known_skin_type, fitzpatrick_scale, known_allergies")
        .eq("id", user.id)
        .single();

      const profile: UserProfile = {
        known_skin_type:
          profileRow?.known_skin_type && profileRow.known_skin_type !== "unknown"
            ? (profileRow.known_skin_type as UserProfile["known_skin_type"])
            : "oily",
        fitzpatrick_scale:     profileRow?.fitzpatrick_scale ?? 3,
        price_tier_preference: (localStorage.getItem("skinsight_budget") ?? "budget") as UserProfile["price_tier_preference"],
        is_halal_required:     localStorage.getItem("skinsight_halal") !== "false",
        known_allergies:       profileRow?.known_allergies ?? [],
      };

      const recommendation = await getRecommendation(
        analysis.analysis_id,
        profile,
        session.access_token
      );
      sessionStorage.setItem("skinsight_recommendation", JSON.stringify(recommendation));
      sessionStorage.setItem("skinsight_profile", JSON.stringify(profile));

      // ── Acne zone flash before navigating ──────────────────────────────────
      const acneCondition = analysis.conditions?.find(
        (c: { condition_type: string }) => c.condition_type === "acne"
      );
      const hasAcne = ["moderate", "severe"].includes(
        (acneCondition as { severity_label?: string })?.severity_label ?? ""
      );

      if (hasAcne && lastLandmarksRef.current.length > 0) {
        setAcneDetected(true);
        const overlay = overlayCanvasRef.current;
        if (overlay) drawDots(overlay, lastLandmarksRef.current, true, true);
        await new Promise(r => setTimeout(r, 1500));
      }

      router.push("/results");

    } catch (err) {
      const code = err instanceof AnalysisError ? err.code : "INTERNAL_ERROR";
      const msg  = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorCode(code);
      setErrorMsg(msg);
      setStatus("captured");
    }
  };

  // ── Status labels ─────────────────────────────────────────────────────────────
  const statusLabel: Record<Status, string> = {
    requesting:  "Starting camera…",
    live:        "Live — position your face",
    captured:    acneDetected ? "Acne zones detected" : "Photo captured — ready",
    scanning:    "Analysing…",
    denied:      "Camera blocked",
    unsupported: "Camera not supported",
    error:       "Error — see below",
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* ── Left: tips ── */}
          <div className="lg:col-span-5 pt-8">
            <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
              Live Diagnostics
            </span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-background leading-[1.1] tracking-tight mb-8">
              Precision <br />
              <span className="text-primary">Dermal Analysis</span>
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-10 max-w-md">
              Point your camera at your face. Our AI analyses 7 skin conditions in under
              5 seconds. Ensure good lighting for the most accurate results.
            </p>

            {/* Tips */}
            <div className="space-y-4">
              {[
                { icon: "light_mode",          title: "Optimal Lighting",  desc: "Use natural daylight or bright white indoor light." },
                { icon: "center_focus_strong", title: "Steady Focus",      desc: "Hold the device parallel to your face for 3 seconds." },
                { icon: "face",                title: "Front-Facing",      desc: "Your full face must be visible and centred in the frame." },
              ].map((tip) => (
                <div key={tip.title} className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-low">
                  <span className="material-symbols-outlined text-primary mt-1">{tip.icon}</span>
                  <div>
                    <h3 className="font-headline font-bold text-on-surface">{tip.title}</h3>
                    <p className="text-sm text-on-surface-variant">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: viewfinder ── */}
          <div className="lg:col-span-7">

            {errorMsg && errorCode && (
              <QualityFeedback
                code={errorCode}
                message={errorMsg}
                onDismiss={() => { setErrorMsg(null); setErrorCode(null); }}
              />
            )}

            {/* Camera window */}
            <div className="relative aspect-square md:aspect-video w-full rounded-[2rem] overflow-hidden bg-black shadow-2xl ring-8 ring-primary/10 border-4 border-primary">

              {/* Live video */}
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""} ${snapshot ? "hidden" : "block"}`}
              />

              {/* Snapshot preview */}
              {snapshot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snapshot} alt="Captured" className="w-full h-full object-cover" />
              )}

              {/* Denied / unsupported fallback */}
              {(status === "denied" || status === "unsupported") && !snapshot && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-container p-8 text-center">
                  <span className="material-symbols-outlined text-secondary text-5xl">no_photography</span>
                  <p className="font-headline font-bold text-on-surface text-lg">
                    {status === "denied" ? "Camera access was blocked" : "Camera not available"}
                  </p>
                  <p className="text-sm text-on-surface-variant max-w-xs">
                    {status === "denied"
                      ? "Allow camera access in your browser settings, then reload the page."
                      : "Your browser doesn't support camera access."}
                  </p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    Upload a photo instead
                  </button>
                </div>
              )}

              {/* MediaPipe landmark overlay canvas */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 w-full h-full z-[5] pointer-events-none ${facingMode === "user" ? "-scale-x-100" : ""}`}
              />

              {/* UI overlay (corner brackets, status badge, scan line) */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {status === "scanning" && <div className="scan-line" />}
                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-secondary rounded-tl-xl opacity-80" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-secondary rounded-tr-xl opacity-80" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-secondary rounded-bl-xl opacity-80" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-secondary rounded-br-xl opacity-80" />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 glass-panel bg-black/30 rounded-full border border-white/20">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    status === "live"                            ? "bg-green-400 animate-pulse" :
                    status === "scanning"                        ? "bg-secondary animate-pulse" :
                    status === "captured" && acneDetected        ? "bg-red-400 animate-pulse" :
                    status === "captured"                        ? "bg-primary" :
                    "bg-outline"
                  }`} />
                  <span className="text-white text-xs font-bold tracking-widest uppercase font-label whitespace-nowrap">
                    {statusLabel[status]}
                  </span>
                </div>
              </div>

              {/* Flip camera */}
              {status === "live" && (
                <button
                  onClick={flipCamera}
                  className="absolute bottom-5 right-5 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
                </button>
              )}
            </div>

            {/* Hidden capture canvas + file input */}
            <canvas ref={canvasRef} className="hidden" />
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

            {/* Action buttons */}
            <div className="mt-8 flex flex-col items-center gap-4">
              {status === "live" && (
                <button
                  onClick={captureFrame}
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 font-headline font-extrabold text-white bg-gradient-to-r from-primary to-secondary rounded-full shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary-fixed transition-all duration-300"
                >
                  <span className="material-symbols-outlined">camera</span>
                  <span className="text-xl">Take Photo</span>
                </button>
              )}

              {status === "captured" && (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                  <button
                    onClick={handleAnalyse}
                    className="inline-flex items-center justify-center gap-3 px-10 py-5 font-headline font-extrabold text-white bg-gradient-to-r from-primary to-secondary rounded-full shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary-fixed transition-all duration-300"
                  >
                    <span className="material-symbols-outlined">document_scanner</span>
                    <span className="text-xl">Analyse Skin</span>
                  </button>
                  <button
                    onClick={retake}
                    className="inline-flex items-center gap-2 px-6 py-4 border-2 border-outline-variant/40 text-on-surface-variant rounded-full font-bold text-base hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    Retake
                  </button>
                </div>
              )}

              {status === "scanning" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-surface-container-low rounded-full">
                    <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
                    <span className="font-headline font-bold text-on-surface">Analysing your skin…</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">This may take up to 5 seconds</p>
                </div>
              )}

              {status === "requesting" && (
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-surface-container-low rounded-full opacity-60">
                  <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="font-headline font-bold text-on-surface-variant">Waiting for camera permission…</span>
                </div>
              )}
            </div>

            {(status === "live" || status === "captured") && (
              <p className="text-center mt-5 text-sm text-on-surface-variant">
                Prefer to upload?{" "}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-primary font-bold hover:underline underline-offset-4"
                >
                  Choose a photo from your device
                </button>
              </p>
            )}

            <p className="text-center mt-4 text-on-surface-variant font-medium italic text-sm">
              &quot;Position your face clearly in the frame&quot;
            </p>
          </div>
        </div>

        {/* Info strip */}
        <section className="mt-24 p-8 md:p-12 rounded-[2.5rem] bg-surface-container-low grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: "verified_user", title: "Clinical Accuracy",  desc: "Engineered with 1.2M dermatological data points." },
            { icon: "privacy_tip",   title: "Private & Secure",   desc: "Images encrypted at rest, never shared with third parties." },
            { icon: "speed",         title: "Instant Results",    desc: "Comprehensive skin report in under 5 seconds." },
          ].map((item) => (
            <div key={item.title} className="flex flex-col gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
              <h4 className="font-headline font-bold text-xl">{item.title}</h4>
              <p className="text-on-surface-variant text-sm">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
