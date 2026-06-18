"use client";

import { useEffect } from "react";
import type { RecommendedProduct } from "@/types/recommendation";
import { lookupIngredient } from "@/lib/ingredientData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  known_skin_type: string;
  fitzpatrick_scale: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKIN_TYPE_LABELS: Record<string, string> = {
  oily: "Oily",
  dry: "Dry",
  combination: "Combination",
  normal: "Normal",
  sensitive: "Sensitive",
};

const TIER_LABELS: Record<string, string> = {
  budget: "Budget",
  mid: "Mid-range",
  premium: "Premium",
};

const TIER_COLORS: Record<string, string> = {
  budget: "bg-green-100 text-green-800",
  mid: "bg-blue-100 text-blue-800",
  premium: "bg-purple-100 text-purple-800",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({
  label,
  weight,
  icon,
  description,
  value,
}: {
  label: string;
  weight: number;
  icon: string;
  description: string;
  value: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="p-4 bg-surface-container rounded-2xl">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
          <span className="font-headline font-bold text-on-surface text-xs">{label}</span>
        </div>
        <span className="shrink-0 px-2 py-0.5 bg-primary-fixed text-primary rounded-full text-[10px] font-black font-headline">
          {weight}%
        </span>
      </div>
      <p className="text-[11px] text-on-surface-variant mb-2 pl-6">{description}</p>
      <div className="flex items-center gap-2 pl-6">
        <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-on-surface shrink-0 w-8 text-right">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  product: RecommendedProduct;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: Props) {
  const meta = lookupIngredient(product.key_ingredient);
  const matchPct = Math.round(product.match_score * 100);

  // Read user profile from sessionStorage (stored by scan page)
  let userProfile: UserProfile | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("skinsight_profile");
      if (raw) userProfile = JSON.parse(raw) as UserProfile;
    } catch {
      // ignore
    }
  }

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Personalised skin-type and Fitzpatrick evaluation
  const skinTypeMatched =
    userProfile && meta
      ? meta.skinTypeMatch.includes(userProfile.known_skin_type)
      : null;

  const fitzpatrickDemoted =
    userProfile && meta
      ? meta.fitzpatrickDemotion.includes(userProfile.fitzpatrick_scale)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.product_name} details`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl">

        {/* Drag handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-1 bg-outline-variant/50 rounded-full" />
        </div>

        {/* ── Header (sticky) ────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 pt-4 pb-4 border-b border-outline-variant/20">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">
              {product.brand_name}
            </p>
            <h2 className="font-headline font-bold text-on-surface text-lg leading-tight mt-0.5 pr-2">
              {product.product_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="font-headline font-black text-primary">
                RM {product.price_myr.toFixed(2)}
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${TIER_COLORS[product.price_tier]}`}
              >
                {TIER_LABELS[product.price_tier]}
              </span>
              {product.is_halal && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Halal
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Active Ingredient ─────────────────────────────────────────────── */}
          <section>
            <SectionHeader icon="biotech" label="Active Ingredient" />
            {meta ? (
              <div className="p-4 bg-primary-fixed rounded-2xl">
                <p className="font-headline font-bold text-on-primary-fixed text-base mb-1">
                  {meta.displayName}
                </p>
                <p className="text-on-primary-fixed-variant text-sm leading-relaxed">
                  {meta.role}
                </p>
                {meta.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {meta.conditions.map(c => (
                      <span
                        key={c}
                        className="px-2 py-0.5 bg-white/30 text-on-primary-fixed rounded-full text-[10px] font-bold uppercase tracking-wider"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-surface-container rounded-2xl">
                <p className="font-headline font-bold text-on-surface text-base mb-1">
                  {product.key_ingredient}
                </p>
                <p className="text-on-surface-variant text-sm">
                  Active ingredient in this formulation.
                </p>
              </div>
            )}
          </section>

          {/* Scoring Breakdown ─────────────────────────────────────────────── */}
          <section>
            <SectionHeader icon="bar_chart" label="Scoring Breakdown" />

            {/* Overall donut */}
            <div className="flex items-center gap-4 p-4 bg-surface-container rounded-2xl mb-4">
              <div className="relative w-14 h-14 shrink-0">
                <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#FFF2D0" strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r="20" fill="none"
                    stroke="#E36A6A" strokeWidth="4"
                    strokeDasharray={`${product.match_score * 125.6} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-headline font-black text-primary text-sm">{matchPct}%</span>
                </div>
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface text-sm">Overall Match Score</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Weighted sum of the four criteria below
                </p>
              </div>
            </div>

            {meta ? (
              <div className="space-y-3">
                {/* Criterion 1 – Severity × Strength */}
                <ScoreBar
                  label="Severity × Ingredient Strength"
                  weight={45}
                  icon="fitness_center"
                  description="Condition severity multiplied by the ingredient's clinical strength rating"
                  value={meta.strengthScore}
                />

                {/* Criterion 2 – Evidence Level */}
                <ScoreBar
                  label="Evidence Level"
                  weight={30}
                  icon="science"
                  description="Quality of peer-reviewed research supporting this ingredient's efficacy"
                  value={meta.evidenceScore}
                />

                {/* Criterion 3 – Skin Type Match */}
                <div className="p-4 bg-surface-container rounded-2xl">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                      <span className="font-headline font-bold text-on-surface text-xs">
                        Skin Type Compatibility
                      </span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 bg-primary-fixed text-primary rounded-full text-[10px] font-black font-headline">
                      20%
                    </span>
                  </div>

                  {skinTypeMatched !== null ? (
                    <p
                      className={`text-[11px] font-bold pl-6 mb-2 ${skinTypeMatched ? "text-green-700" : "text-amber-700"}`}
                    >
                      {skinTypeMatched
                        ? `✓ Matched your skin type (${SKIN_TYPE_LABELS[userProfile!.known_skin_type]})`
                        : `△ Not optimal for ${SKIN_TYPE_LABELS[userProfile!.known_skin_type]} skin`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-on-surface-variant pl-6 mb-2">
                      Compatible with:
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {(["oily", "dry", "combination", "normal", "sensitive"] as const).map(st => {
                      const compatible = meta.skinTypeMatch.includes(st);
                      const isUser = userProfile?.known_skin_type === st;
                      return (
                        <span
                          key={st}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            compatible
                              ? isUser
                                ? "bg-primary text-on-primary ring-2 ring-primary ring-offset-1"
                                : "bg-primary/20 text-primary"
                              : "bg-surface-container-high text-on-surface-variant line-through opacity-50"
                          }`}
                        >
                          {SKIN_TYPE_LABELS[st]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Criterion 4 – Fitzpatrick Adjustment */}
                <div className="p-4 bg-surface-container rounded-2xl">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">wb_sunny</span>
                      <span className="font-headline font-bold text-on-surface text-xs">
                        Fitzpatrick Scale Adjustment
                      </span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 bg-primary-fixed text-primary rounded-full text-[10px] font-black font-headline">
                      5%
                    </span>
                  </div>

                  {meta.fitzpatrickDemotion.length === 0 ? (
                    <p className="text-[11px] text-green-700 font-bold pl-6">
                      ✓ Suitable for all Fitzpatrick skin tones (Types I–VI)
                    </p>
                  ) : (
                    <>
                      {fitzpatrickDemoted !== null && (
                        <p
                          className={`text-[11px] font-bold pl-6 mb-2 ${fitzpatrickDemoted ? "text-amber-700" : "text-green-700"}`}
                        >
                          {fitzpatrickDemoted
                            ? `△ Score demoted for your skin tone (Type ${userProfile!.fitzpatrick_scale}) — higher PIH risk on darker skin`
                            : `✓ Full score for your skin tone (Type ${userProfile!.fitzpatrick_scale})`}
                        </p>
                      )}
                      {fitzpatrickDemoted === null && (
                        <p className="text-[11px] text-on-surface-variant pl-6 mb-2">
                          Score is demoted for Types{" "}
                          {meta.fitzpatrickDemotion.join(", ")} due to higher risk of
                          post-inflammatory hyperpigmentation on darker skin tones.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 pl-6">
                        {([1, 2, 3, 4, 5, 6] as const).map(t => {
                          const demoted = meta.fitzpatrickDemotion.includes(t);
                          const isUser = userProfile?.fitzpatrick_scale === t;
                          return (
                            <span
                              key={t}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                demoted
                                  ? isUser
                                    ? "bg-amber-200 text-amber-900 ring-2 ring-amber-400 ring-offset-1"
                                    : "bg-amber-100 text-amber-800"
                                  : isUser
                                    ? "bg-primary text-on-primary ring-2 ring-primary ring-offset-1"
                                    : "bg-primary/20 text-primary"
                              }`}
                            >
                              Type {t} {demoted ? "↓" : "✓"}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant p-4 bg-surface-container rounded-2xl">
                Detailed scoring data is not available for this ingredient.
              </p>
            )}
          </section>

          {/* Incompatible Pairs ────────────────────────────────────────────── */}
          {meta && meta.incompatibleWith.length > 0 && (
            <section>
              <SectionHeader icon="block" label="Ingredient Incompatibilities" color="error" />
              <div className="p-4 bg-error-container rounded-2xl space-y-3">
                <p className="text-on-error-container text-xs leading-relaxed">
                  The following combinations were excluded from your routine to prevent
                  skin irritation or reduced efficacy:
                </p>
                {meta.incompatibleWith.map(pair => (
                  <div key={pair.inci} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-error text-base shrink-0 mt-0.5">
                      dangerous
                    </span>
                    <div>
                      <p className="font-bold text-on-error-container text-xs">
                        {meta.displayName} + {pair.displayName}
                      </p>
                      <p className="text-on-error-container text-[11px] mt-0.5 leading-relaxed">
                        {pair.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom padding */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  color = "primary",
}: {
  icon: string;
  label: string;
  color?: "primary" | "error";
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className={`material-symbols-outlined text-xl ${color === "error" ? "text-error" : "text-primary"}`}
      >
        {icon}
      </span>
      <h3 className="font-headline font-bold text-on-surface text-xs uppercase tracking-widest">
        {label}
      </h3>
    </div>
  );
}
