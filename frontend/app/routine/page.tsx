"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailModal from "@/components/ProductDetailModal";
import type { RecommendationResult, RoutineStep, RecommendedProduct } from "@/types/recommendation";

// ─── Step icons ───────────────────────────────────────────────────────────────

const STEP_ICONS: Record<string, string> = {
  cleanser: "soap",
  "makeup remover / micellar water": "water_drop",
  toner: "science",
  "exfoliating toner (2–3× weekly)": "science",
  serum: "medical_services",
  "treatment serum": "vaccines",
  moisturiser: "opacity",
  "night moisturiser": "nights_stay",
  "sunscreen (spf 50+)": "wb_sunny",
  "spot treatment": "healing",
};

function stepIcon(name: string): string {
  return STEP_ICONS[name.toLowerCase()] ?? "spa";
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product, selected, onSelect, onDetail }: {
  product: RecommendedProduct;
  selected: boolean;
  onSelect: () => void;
  onDetail: (p: RecommendedProduct) => void;
}) {
  const tierLabel: Record<string, string> = { budget: "Budget", mid: "Mid-range", premium: "Premium" };
  const tierColor: Record<string, string> = {
    budget: "bg-green-100 text-green-800",
    mid: "bg-blue-100 text-blue-800",
    premium: "bg-purple-100 text-purple-800",
  };

  return (
    <button
      onClick={() => { onSelect(); onDetail(product); }}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
        selected
          ? "border-primary bg-primary-fixed shadow-md"
          : "border-outline-variant/30 bg-surface-container hover:border-primary/40 hover:bg-surface-container-high"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-on-surface text-sm leading-tight truncate">
            {product.product_name}
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">{product.brand_name}</p>
        </div>
        {selected && (
          <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {product.is_halal && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[12px]">verified</span>Halal
          </span>
        )}
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierColor[product.price_tier]}`}>
          {tierLabel[product.price_tier]}
        </span>
        <span className="inline-block px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-full text-[10px] font-bold uppercase tracking-wider">
          {product.key_ingredient}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-headline font-black text-primary text-base">
          RM {product.price_myr.toFixed(2)}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${product.match_score * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant font-bold">
            {Math.round(product.match_score * 100)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-outline-variant/20">
        <span className="material-symbols-outlined text-primary text-[14px]">info</span>
        <span className="text-[10px] text-primary font-bold uppercase tracking-wider font-label">
          Tap to view ingredient details
        </span>
      </div>
    </button>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, onDetail }: {
  step: RoutineStep;
  onDetail: (p: RecommendedProduct) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
      {/* Step header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">
            {stepIcon(step.step_name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">
              Step {step.step_number}
            </span>
          </div>
          <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
            {step.step_name}
          </h3>
        </div>
      </div>

      {/* Instruction */}
      <p className="text-sm text-on-surface-variant leading-relaxed mb-5 pl-1">
        {step.instruction}
      </p>

      {/* Products */}
      {step.products.length > 1 && (
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 font-label">
          Choose one
        </p>
      )}
      <div className={`grid gap-3 ${step.products.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {step.products.map((product, idx) => (
          <ProductCard
            key={product.product_name}
            product={product}
            selected={selectedIdx === idx}
            onSelect={() => setSelectedIdx(idx)}
            onDetail={onDetail}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoutinePage() {
  const [activeTab, setActiveTab]         = useState<"am" | "pm">("am");
  const [rec, setRec]                     = useState<RecommendationResult | null>(null);
  const [notFound, setNotFound]           = useState(false);
  const [detailProduct, setDetailProduct] = useState<RecommendedProduct | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("skinsight_recommendation");
    if (!raw) { setNotFound(true); return; }
    try {
      setRec(JSON.parse(raw) as RecommendationResult);
    } catch {
      setNotFound(true);
    }
  }, []);

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-32 min-h-screen flex flex-col items-center justify-center px-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">spa</span>
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">No routine yet</h1>
          <p className="text-on-surface-variant mb-8 text-center max-w-sm">
            Complete a skin scan first and your personalised routine will appear here.
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

  if (!rec) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-32 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-on-surface-variant font-headline">Loading your routine…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const matchPct = Math.round(rec.overall_match_score * 100);

  return (
    <>
      <Navbar />

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}

      <main className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            Personalised Routine
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight">
                Your Skincare Routine
              </h1>
              <p className="text-on-surface-variant mt-2">Generated from your latest analysis</p>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-lowest rounded-2xl shadow-sm shrink-0">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#FFF2D0" strokeWidth="4" />
                  <circle
                    cx="24" cy="24" r="20" fill="none"
                    stroke="#E36A6A" strokeWidth="4"
                    strokeDasharray={`${(rec.overall_match_score) * 125.6} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-headline font-black text-primary text-sm">{matchPct}%</span>
                </div>
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface text-sm">Match Score</p>
                <p className="text-xs text-on-surface-variant">Based on your skin profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning card */}
        <div className="mb-10 p-6 md:p-8 bg-primary-fixed rounded-3xl border-l-4 border-primary">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0">psychology</span>
            <div>
              <h2 className="font-headline font-bold text-on-primary-fixed text-base mb-2">Why these products?</h2>
              <p className="text-on-primary-fixed-variant text-sm leading-relaxed">{rec.reasoning_text}</p>
            </div>
          </div>
        </div>

        {/* Safety warnings */}
        {rec.safety_warnings.length > 0 && (
          <div className="mb-10 p-5 bg-secondary-fixed rounded-2xl border-l-4 border-secondary">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary text-xl mt-0.5 shrink-0">warning</span>
              <div>
                <p className="font-headline font-bold text-on-secondary-fixed text-sm mb-2">Safety Notes</p>
                <ul className="space-y-1">
                  {rec.safety_warnings.map((w, i) => (
                    <li key={i} className="text-on-secondary-fixed text-xs leading-relaxed flex items-start gap-2">
                      <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-secondary inline-block" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Referral note */}
        {rec.referral_note && (
          <div className="mb-10 p-5 bg-error-container rounded-2xl border-l-4 border-error">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error text-xl mt-0.5 shrink-0">local_hospital</span>
              <p className="text-on-error-container text-sm leading-relaxed">{rec.referral_note}</p>
            </div>
          </div>
        )}

        {/* AM/PM Tab switcher */}
        <div className="flex gap-3 mb-8">
          {(["am", "pm"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-headline font-bold text-sm transition-all duration-200 ${
                activeTab === tab
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab === "am" ? "wb_sunny" : "nights_stay"}
              </span>
              {tab === "am" ? "Morning Routine" : "Evening Routine"}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
              }`}>
                {tab === "am" ? rec.am_routine.length : rec.pm_routine.length} steps
              </span>
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {(activeTab === "am" ? rec.am_routine : rec.pm_routine).map((step) => (
            <StepCard key={step.step_number} step={step} onDetail={setDetailProduct} />
          ))}
        </div>

        {/* Timeline summary strip */}
        <div className="mt-14 p-6 md:p-8 bg-surface-container-lowest rounded-3xl shadow-sm">
          <h2 className="font-headline font-bold text-on-surface mb-6">
            {activeTab === "am" ? "Morning" : "Evening"} Routine at a Glance
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {(activeTab === "am" ? rec.am_routine : rec.pm_routine).map((step, i, arr) => (
              <div key={step.step_number} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-primary-fixed rounded-xl">
                  <span className="material-symbols-outlined text-primary text-[16px]">{stepIcon(step.step_name)}</span>
                  <span className="text-xs font-bold text-primary font-headline">{step.step_name}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tip card */}
        <div className="mt-6 p-6 bg-surface-container-low rounded-2xl flex items-start gap-4">
          <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">lightbulb</span>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface">Consistency is key.</span>{" "}
            Stick to this routine for at least 4–6 weeks before expecting visible improvements.
            Scan again then to track your progress.
          </p>
        </div>

        {/* Bottom actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/scan"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">add_a_photo</span>
            New Scan
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-outline-variant/30 text-primary rounded-xl font-bold text-base hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">history</span>
            View History
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-outline-variant/30 text-on-surface-variant rounded-xl font-bold text-base hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">print</span>
            Print Routine
          </button>
        </div>

      </main>
      <Footer />
    </>
  );
}
