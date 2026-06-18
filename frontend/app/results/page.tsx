"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SkinCard from "@/components/SkinCard";
import SeverityBadge from "@/components/SeverityBadge";
import { useSession } from "@/components/providers/SessionProvider";
import { CONDITION_ARTICLES, COLOR_MAP } from "@/lib/skinEducation";
import type { AnalysisResponse, ConditionResult, PredictResponse, SeverityLabel, ConditionType } from "@/types/analysis";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

// ─── Condition metadata ────────────────────────────────────────────────────────

const CONDITION_ICONS: Record<string, string> = {
  acne:          "healing",
  dryness:       "dry",
  oiliness:      "water_drop",
  pigmentation:  "tonality",
  texture:       "texture",
  sensitivity:   "sentiment_neutral",
  redness:       "favorite",
};

function conditionDescription(c: ConditionResult): string {
  switch (c.condition_type) {
    case "acne": {
      const subtype = c.acne_subtype ? ` (${c.acne_subtype})` : "";
      const count   = c.acne_lesion_count ? ` — ${c.acne_lesion_count} lesions detected` : "";
      const zones   = c.affected_zones?.length ? ` in ${c.affected_zones.join(", ")}.` : ".";
      return `Acne${subtype} detected${zones}${count}`;
    }
    case "oiliness": {
      const prod  = c.sebum_production ? ` Sebum production: ${c.sebum_production}.` : "";
      const zones = c.oily_zones?.length ? ` Affected zones: ${c.oily_zones.join(", ")}.` : "";
      return `Elevated oil levels detected.${prod}${zones}`;
    }
    case "dryness":
      return c.severity_label === "none"
        ? "Skin hydration levels are within normal range."
        : `Dryness detected${c.affected_zones?.length ? ` on ${c.affected_zones.join(", ")}` : ""}.`;
    case "pigmentation":
      return c.severity_label === "none"
        ? "No significant pigmentation detected."
        : `Hyperpigmentation detected${c.affected_zones?.length ? ` on ${c.affected_zones.join(", ")}` : ""}.`;
    case "texture":
      return c.severity_label === "none"
        ? "Skin texture is smooth."
        : `Surface irregularities observed${c.affected_zones?.length ? ` on ${c.affected_zones.join(", ")}` : ""}.`;
    case "sensitivity":
      return c.severity_label === "none"
        ? "No significant sensitivity markers detected."
        : "Sensitivity markers detected — avoid harsh actives.";
    case "redness":
      return c.severity_label === "none"
        ? "Redness is within normal range."
        : `Redness detected${c.affected_zones?.length ? ` on ${c.affected_zones.join(", ")}` : ""}.`;
    default:
      return "";
  }
}

// ─── Doctor Referral Logic ─────────────────────────────────────────────────────

type ReferralLevel = "urgent" | "recommended" | "optional" | "clear";

function getReferralLevel(analysis: AnalysisResponse): ReferralLevel {
  const hasSevere   = analysis.conditions.some(c => c.severity_label === "severe");
  const hasModerate = analysis.conditions.some(c => c.severity_label === "moderate");
  if (analysis.referral_recommended && hasSevere)   return "urgent";
  if (analysis.referral_recommended)                return "recommended";
  if (hasModerate)                                  return "optional";
  return "clear";
}

function getReferralConditions(analysis: AnalysisResponse): ConditionResult[] {
  return analysis.conditions.filter(
    c => c.severity_label === "severe" || c.severity_label === "moderate"
  );
}

function getSpecialist(conditions: ConditionResult[]): { name: string; reason: string } {
  const types = conditions.map(c => c.condition_type);
  if (types.includes("acne")) {
    const acne = conditions.find(c => c.condition_type === "acne");
    if (acne?.acne_subtype === "cystic")
      return { name: "Dermatologist", reason: "Cystic acne requires prescription-strength treatments not available over the counter." };
    return { name: "Dermatologist", reason: "Persistent acne may need topical retinoids or oral medication." };
  }
  if (types.includes("sensitivity") || types.includes("redness"))
    return { name: "Dermatologist or Allergist", reason: "Sensitivity and redness may indicate rosacea or a contact allergy requiring patch testing." };
  if (types.includes("pigmentation"))
    return { name: "Dermatologist", reason: "Pigmentation disorders benefit from professional assessment and targeted therapies." };
  if (types.includes("dryness"))
    return { name: "Dermatologist", reason: "Severe dryness may indicate eczema or impaired skin barrier requiring prescription care." };
  return { name: "General Practitioner (GP)", reason: "A GP can evaluate your concerns and issue a specialist referral if needed." };
}

const REFERRAL_CONFIG: Record<ReferralLevel, {
  icon: string; label: string; wrapperClass: string;
  badgeClass: string; iconClass: string; description: string;
}> = {
  urgent: {
    icon: "emergency",
    label: "Urgent Referral Recommended",
    wrapperClass: "bg-red-50 border-red-200",
    badgeClass: "bg-red-100 text-red-800",
    iconClass: "text-red-600",
    description: "Your analysis detected severe skin conditions. We strongly recommend seeking professional care soon to prevent progression and get effective treatment.",
  },
  recommended: {
    icon: "local_hospital",
    label: "Referral Recommended",
    wrapperClass: "bg-orange-50 border-orange-200",
    badgeClass: "bg-orange-100 text-orange-800",
    iconClass: "text-orange-600",
    description: "Based on your results, a dermatologist consultation is recommended. Professional care can significantly improve your treatment outcomes.",
  },
  optional: {
    icon: "medical_information",
    label: "Optional Consultation",
    wrapperClass: "bg-yellow-50 border-yellow-200",
    badgeClass: "bg-yellow-100 text-yellow-800",
    iconClass: "text-yellow-600",
    description: "Your skin is manageable with a consistent routine, but a professional opinion could help address moderate concerns more effectively.",
  },
  clear: {
    icon: "check_circle",
    label: "No Referral Needed",
    wrapperClass: "bg-green-50 border-green-200",
    badgeClass: "bg-green-100 text-green-800",
    iconClass: "text-green-600",
    description: "Your skin looks healthy. Continue with a consistent skincare routine to maintain and improve your results.",
  },
};

// ─── Print / Download helper ───────────────────────────────────────────────────

function generatePrintHTML({
  level, cfg, flagged, specialist, analysis, analysedAt,
}: {
  level: ReferralLevel;
  cfg: { label: string; description: string };
  flagged: ConditionResult[];
  specialist: { name: string; reason: string } | null;
  analysis: AnalysisResponse;
  analysedAt: string;
}): string {
  const badgeStyle: Record<ReferralLevel, string> = {
    urgent:      "background:#fee2e2;color:#991b1b",
    recommended: "background:#ffedd5;color:#9a3412",
    optional:    "background:#fef9c3;color:#854d0e",
    clear:       "background:#dcfce7;color:#166534",
  };
  const bannerStyle: Record<ReferralLevel, string> = {
    urgent:      "background:#fef2f2;border:2px solid #fecaca",
    recommended: "background:#fff7ed;border:2px solid #fed7aa",
    optional:    "background:#fffbeb;border:2px solid #fde68a",
    clear:       "background:#f0fdf4;border:2px solid #bbf7d0",
  };

  const conditionsHTML = flagged.length > 0 ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;font-weight:700;margin-bottom:12px">Conditions of Concern</div>
        ${flagged.map(c => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6">
            <span style="font-weight:600;text-transform:capitalize">${c.condition_type}${c.acne_subtype ? ` <span style="font-size:11px;color:#9ca3af">(${c.acne_subtype})</span>` : ""}</span>
            <span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:9999px;${c.severity_label === "severe" ? "background:#fee2e2;color:#991b1b" : "background:#ffedd5;color:#9a3412"}">${c.severity_label}</span>
          </div>`).join("")}
      </div>
      ${specialist ? `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;font-weight:700;margin-bottom:12px">Recommended Specialist</div>
        <div style="font-size:18px;font-weight:700;color:#E36A6A;margin-bottom:8px">${specialist.name}</div>
        <div style="font-size:12px;color:#6b7280;line-height:1.5">${specialist.reason}</div>
      </div>` : ""}
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:20px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;font-weight:700;margin-bottom:12px">Bring to Your Appointment</div>
      <ul style="list-style:none;padding:0;margin:0">
        ${["How long you've had these skin concerns","Current skincare products you use","Any known allergies or sensitivities","Family history of skin conditions","Previous treatments you have tried","This AI skin analysis report"]
          .map(item => `<li style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#374151;margin-bottom:8px"><span style="color:#16a34a;font-weight:700;flex-shrink:0">✓</span>${item}</li>`).join("")}
      </ul>
    </div>` : `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      ${["Apply SPF 30+ daily, even indoors.","Stay hydrated — aim for 8 glasses of water a day.","Consistent sleep supports skin repair and cell turnover.","Limit high-glycaemic foods that can trigger breakouts.","Cleanse gently twice daily to maintain skin barrier health.","Re-scan every 4–6 weeks to track your skin's progress."]
        .map(tip => `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:12px;color:#166534;line-height:1.4">${tip}</div>`).join("")}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Doctor Referral Report — SkinSight</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;padding:40px 48px;background:#fff;font-size:14px}
    @media print{body{padding:20px 28px}button{display:none}}
  </style>
</head>
<body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;border-bottom:3px solid #E36A6A;padding-bottom:16px">
    <div>
      <div style="font-size:22px;font-weight:800;color:#E36A6A;letter-spacing:-.5px">SkinSight</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.15em;margin-top:2px">AI Skin Analysis — Doctor Referral Report</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#9ca3af;line-height:1.6">Generated by SkinSight AI<br/>Not a medical diagnosis</div>
  </div>

  <div style="display:flex;gap:32px;flex-wrap:wrap;margin-bottom:24px">
    <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px">Analysis Date</div><div style="font-weight:600">${analysedAt}</div></div>
    <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px">Health Score</div><div style="font-weight:600">${analysis.overall_health_score} / 100 (${analysis.skin_health_label})</div></div>
    <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px">Model Confidence</div><div style="font-weight:600">${Math.round(analysis.model_confidence * 100)}%</div></div>
    <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:3px">Referral Status</div><span style="font-size:11px;font-weight:700;padding:3px 12px;border-radius:9999px;text-transform:uppercase;letter-spacing:.08em;${badgeStyle[level]}">${cfg.label}</span></div>
  </div>

  <div style="padding:16px 20px;border-radius:10px;margin-bottom:24px;${bannerStyle[level]}">
    <div style="font-size:13px;color:#374151;line-height:1.5">${cfg.description}</div>
  </div>

  ${conditionsHTML}

  <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;line-height:1.6">
    <strong style="color:#6b7280">Disclaimer:</strong> This referral report is generated by an AI skin analysis tool and does not constitute medical advice or a clinical diagnosis. Always consult a qualified healthcare professional for evaluation and treatment. SkinSight · ${new Date().toLocaleDateString("en-MY")}
  </div>
</body>
</html>`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router = useRouter();
  const { session } = useSession();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [predict,  setPredict]  = useState<PredictResponse | null>(null);
  const [notFound, setNotFound]  = useState(false);

  useEffect(() => {
    // Check URL for ?id= param (coming from history page)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("id");

    const rawPredict = sessionStorage.getItem("skinsight_predict");
    if (rawPredict) {
      try { setPredict(JSON.parse(rawPredict) as PredictResponse); } catch { /* ignore */ }
    }

    const raw = sessionStorage.getItem("skinsight_analysis");
    if (raw) {
      try {
        const cached = JSON.parse(raw) as AnalysisResponse;
        // Use cache if no URL id, or if URL id matches cached id
        if (!idFromUrl || cached.analysis_id === idFromUrl) {
          setAnalysis(cached);
          return;
        }
      } catch { /* ignore */ }
    }

    if (idFromUrl && session?.access_token) {
      fetch(`${API_URL}/api/v1/analyze/${idFromUrl}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error("not found");
          return r.json();
        })
        .then((data: AnalysisResponse) => {
          sessionStorage.setItem("skinsight_analysis", JSON.stringify(data));
          setAnalysis(data);
        })
        .catch(() => setNotFound(true));
      return;
    }

    if (!raw) setNotFound(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-32 min-h-screen flex flex-col items-center justify-center px-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">sentiment_dissatisfied</span>
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">No analysis found</h1>
          <p className="text-on-surface-variant mb-8 text-center max-w-sm">
            It looks like you haven't run a scan yet. Take a photo first and your results will appear here.
          </p>
          <Link
            href="/scan"
            className="cta-gradient text-white font-headline font-bold px-8 py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          >
            Start a Scan
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (!analysis) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-32 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-on-surface-variant font-headline">Loading your results…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const healthScore = analysis.overall_health_score;
  const healthLabel = analysis.skin_health_label;
  const analysedAt  = new Date(analysis.analysed_at).toLocaleString("en-MY", {
    dateStyle: "medium", timeStyle: "short",
  });

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            Analysis Complete
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight mb-2">
            Your Skin Report
          </h1>
          <p className="text-on-surface-variant">
            Analysed {analysedAt} · Confidence {Math.round(analysis.model_confidence * 100)}%
          </p>
        </div>

        {/* Aurora skin defect detection result */}
        {predict && (
          <div className="mb-10 p-6 md:p-8 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">biotech</span>
              <h2 className="font-headline font-bold text-lg text-on-surface">Aurora Defect Detection</h2>
              <span className="ml-auto text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                {predict.confidence} confidence
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-headline font-extrabold text-2xl text-on-surface">{predict.condition}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    predict.severity === "None"     ? "bg-green-100  text-green-800"  :
                    predict.severity === "Mild"     ? "bg-yellow-100 text-yellow-800" :
                    predict.severity === "Moderate" ? "bg-orange-100 text-orange-800" :
                                                     "bg-red-100    text-red-800"
                  }`}>
                    {predict.severity}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
                  {predict.description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Overall score sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm sticky top-28">
              <h2 className="font-headline font-bold text-lg text-on-surface mb-6">Overall Skin Health</h2>
              <div className="flex flex-col items-center mb-8">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#FFF2D0" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="#E36A6A" strokeWidth="10"
                      strokeDasharray={`${(healthScore / 100) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-headline font-black text-primary">{healthScore}</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-widest">{healthLabel}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {analysis.conditions.map((c) => (
                  <div key={c.condition_type} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-on-surface">{c.condition_type}</span>
                    <SeverityBadge severity={c.severity_label} />
                  </div>
                ))}
              </div>

              {analysis.referral_recommended && (
                <div className="p-4 bg-error-container rounded-2xl text-xs text-on-error-container leading-relaxed mb-4 flex items-start gap-2">
                  <span className="material-symbols-outlined text-error text-base shrink-0">local_hospital</span>
                  We recommend consulting a dermatologist for your skin concerns.
                </div>
              )}

              <div className="p-4 bg-surface-container-low rounded-2xl text-xs text-on-surface-variant leading-relaxed mb-6">
                This is not a medical diagnosis. Consult a dermatologist for clinical concerns.
              </div>

              <Link
                href="/routine"
                className="w-full block text-center cta-gradient text-white font-headline font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
              >
                Get My Routine
              </Link>
            </div>
          </div>

          {/* Condition cards */}
          <div className="lg:col-span-2">
            <h2 className="font-headline font-bold text-xl text-on-surface mb-6">Condition Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {analysis.conditions.map((c) => (
                <SkinCard
                  key={c.condition_type}
                  condition={c.condition_type}
                  severity={c.severity_label as SeverityLabel}
                  score={c.severity_score}
                  icon={CONDITION_ICONS[c.condition_type] ?? "spa"}
                  description={conditionDescription(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Doctor Referral Assessment ─────────────────────────────────── */}
        {(() => {
          const level      = getReferralLevel(analysis);
          const cfg        = REFERRAL_CONFIG[level];
          const flagged    = getReferralConditions(analysis);
          const specialist = flagged.length > 0 ? getSpecialist(flagged) : null;
          const showCards  = level !== "clear";

          const handlePrint = () => {
            const win = window.open("", "_blank", "width=920,height=700");
            if (!win) return;
            win.document.write(generatePrintHTML({ level, cfg, flagged, specialist, analysis, analysedAt }));
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 600);
          };

          return (
            <section className={`mt-12 rounded-3xl border-2 p-8 md:p-10 ${cfg.wrapperClass}`}>

              {/* Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.badgeClass.split(" ")[0]}`}>
                  <span className={`material-symbols-outlined text-2xl ${cfg.iconClass}`}>{cfg.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="font-headline font-bold text-xl text-on-surface">Doctor Referral Assessment</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">{cfg.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/70 hover:bg-white text-on-surface border border-outline-variant/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    Print
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/70 hover:bg-white text-on-surface border border-outline-variant/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    PDF
                  </button>
                </div>
              </div>

              {showCards ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {/* Conditions of Concern */}
                  {flagged.length > 0 && (
                    <div className="bg-white/70 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">warning</span>
                        <h3 className="font-headline font-semibold text-xs text-on-surface uppercase tracking-widest">Conditions of Concern</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {flagged.map(c => (
                          <li key={c.condition_type} className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-sm capitalize font-medium text-on-surface">{c.condition_type}</span>
                              {c.acne_subtype && (
                                <span className="ml-1.5 text-xs text-on-surface-variant">({c.acne_subtype})</span>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                              c.severity_label === "severe"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}>
                              {c.severity_label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Specialist */}
                  {specialist && (
                    <div className="bg-white/70 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">medical_services</span>
                        <h3 className="font-headline font-semibold text-xs text-on-surface uppercase tracking-widest">Recommended Specialist</h3>
                      </div>
                      <p className="font-headline font-bold text-on-surface text-base mb-2">{specialist.name}</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{specialist.reason}</p>
                    </div>
                  )}

                  {/* Bring to Your Appointment */}
                  <div className="bg-white/70 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">checklist</span>
                      <h3 className="font-headline font-semibold text-xs text-on-surface uppercase tracking-widest">Bring to Your Appointment</h3>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "How long you've had these skin concerns",
                        "Current skincare products you use",
                        "Any known allergies or sensitivities",
                        "Family history of skin conditions",
                        "Previous treatments you have tried",
                        "This AI skin analysis report",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm text-green-600 shrink-0 mt-px">check</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Clear — simple maintenance tips */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { icon: "wb_sunny",    tip: "Apply SPF 30+ daily, even indoors." },
                    { icon: "water_drop",  tip: "Stay hydrated — aim for 8 glasses of water a day." },
                    { icon: "bedtime",     tip: "Consistent sleep supports skin repair and cell turnover." },
                    { icon: "no_food",     tip: "Limit high-glycaemic foods that can trigger breakouts." },
                    { icon: "clean_hands", tip: "Cleanse gently twice daily to maintain skin barrier health." },
                    { icon: "update",      tip: "Re-scan every 4–6 weeks to track your skin's progress." },
                  ].map(({ icon, tip }) => (
                    <div key={tip} className="bg-white/70 rounded-2xl p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-green-600 text-xl shrink-0">{icon}</span>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <p className="mt-6 pt-4 text-xs text-on-surface-variant/70 leading-relaxed border-t border-outline-variant/30">
                <span className="font-semibold">Disclaimer:</span> This referral assessment is generated by an AI skin analysis tool and does not constitute medical advice or a clinical diagnosis. Always consult a qualified healthcare professional for evaluation and treatment.
              </p>
            </section>
          );
        })()}

        {/* ── Skin Health Library ──────────────────────────────────────── */}
        {(() => {
          const detected = analysis.conditions.filter(c => c.severity_label !== "none");
          if (detected.length === 0) return null;

          return (
            <section className="mt-12">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Skin Health Library</h2>
              </div>
              <p className="text-sm text-on-surface-variant mb-8 max-w-2xl">
                Evidence-based articles for the conditions detected in your scan — tailored to Malaysia's tropical climate and lifestyle.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {detected.map((c) => {
                  const article = CONDITION_ARTICLES[c.condition_type as ConditionType];
                  if (!article) return null;
                  const col = COLOR_MAP[article.colorKey];
                  return (
                    <div
                      key={c.condition_type}
                      className={`rounded-2xl border ${col.border} ${col.bg} p-5`}
                    >
                      {/* Card header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${col.iconBg}`}>
                          <span className={`material-symbols-outlined text-xl ${col.text}`}>{article.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-headline font-bold text-base capitalize ${col.text}`}>{c.condition_type}</h3>
                          <p className="text-xs text-on-surface-variant">{article.tagline}</p>
                        </div>
                      </div>

                      {/* Malaysian context blurb */}
                      <p className="text-xs text-on-surface leading-relaxed mb-4 bg-white/60 rounded-xl p-3 border border-white/80">
                        {article.whyMalaysia.slice(0, 200).trimEnd()}…
                      </p>

                      {/* Top 3 tips */}
                      <ul className="space-y-2 mb-4">
                        {article.tips.slice(0, 3).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                            <span className={`material-symbols-outlined text-sm shrink-0 mt-0.5 ${col.text}`}>check_circle</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Link to full article */}
                      <Link
                        href={`/learn#${c.condition_type}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-headline font-semibold ${col.text} hover:underline`}
                      >
                        Read full article
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Link to full library */}
              <div className="mt-6 flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
                <div>
                  <p className="font-headline font-semibold text-sm text-on-surface mb-0.5">Explore the full Skin Health Library</p>
                  <p className="text-xs text-on-surface-variant">All 7 conditions, ingredient guides, and Malaysian skincare tips.</p>
                </div>
                <Link
                  href="/learn"
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 cta-gradient text-white text-sm font-headline font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-base">menu_book</span>
                  Learn More
                </Link>
              </div>
            </section>
          );
        })()}

      </main>
      <Footer />
    </>
  );
}
