"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CONDITION_ARTICLES,
  COLOR_MAP,
  GENERAL_MY_TIPS,
  type ConditionArticle,
} from "@/lib/skinEducation";
import type { ConditionType } from "@/types/analysis";

const CONDITION_ORDER: ConditionType[] = [
  "acne",
  "dryness",
  "oiliness",
  "pigmentation",
  "texture",
  "sensitivity",
  "redness",
];

const FILTER_LABELS: Record<ConditionType | "all", string> = {
  all:          "All Conditions",
  acne:         "Acne",
  dryness:      "Dryness",
  oiliness:     "Oiliness",
  pigmentation: "Pigmentation",
  texture:      "Texture",
  sensitivity:  "Sensitivity",
  redness:      "Redness",
};

// ─── Article card ──────────────────────────────────────────────────────────────

function ArticleCard({
  condition,
  article,
  defaultOpen = false,
}: {
  condition: ConditionType;
  article: ConditionArticle;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const c = COLOR_MAP[article.colorKey];

  return (
    <article
      id={condition}
      className={`rounded-3xl border-2 ${c.border} ${c.bg} overflow-hidden transition-all duration-300`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-6 text-left"
        aria-expanded={open}
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
          <span className={`material-symbols-outlined text-2xl ${c.text}`}>{article.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h2 className={`font-headline font-bold text-lg capitalize ${c.text}`}>{condition}</h2>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${c.tag}`}>
              Evidence-Based
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">{article.tagline}</p>
        </div>

        <span className={`material-symbols-outlined text-xl shrink-0 ${c.text} transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {/* Body — expanded */}
      {open && (
        <div className="px-6 pb-8 space-y-8 border-t border-outline-variant/20">

          {/* What is it */}
          <section className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-lg ${c.text}`}>info</span>
              <h3 className={`font-headline font-semibold text-sm uppercase tracking-widest ${c.text}`}>What is it?</h3>
            </div>
            <p className="text-sm text-on-surface leading-relaxed">{article.what}</p>
          </section>

          {/* Why Malaysia */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-lg ${c.text}`}>public</span>
              <h3 className={`font-headline font-semibold text-sm uppercase tracking-widest ${c.text}`}>In the Malaysian Context</h3>
            </div>
            <div className="bg-white/60 rounded-2xl p-5 border border-white/80">
              <p className="text-sm text-on-surface leading-relaxed">{article.whyMalaysia}</p>
            </div>
          </section>

          {/* Evidence-based care */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-lg ${c.text}`}>checklist</span>
              <h3 className={`font-headline font-semibold text-sm uppercase tracking-widest ${c.text}`}>Evidence-Based Care</h3>
            </div>
            <ul className="space-y-3">
              {article.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-on-surface leading-relaxed">
                  <span className={`material-symbols-outlined text-base shrink-0 mt-0.5 ${c.text}`}>check_circle</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Key ingredients */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-lg ${c.text}`}>science</span>
              <h3 className={`font-headline font-semibold text-sm uppercase tracking-widest ${c.text}`}>Key Ingredients to Look For</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.ingredients.map((ing) => (
                <div key={ing.name} className="bg-white/60 rounded-xl p-4 border border-white/80">
                  <p className={`font-headline font-semibold text-sm mb-1 ${c.text}`}>{ing.name}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{ing.role}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const [filter, setFilter] = useState<ConditionType | "all">("all");

  const visible = filter === "all"
    ? CONDITION_ORDER
    : CONDITION_ORDER.filter(c => c === filter);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-5xl mx-auto">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="mb-12">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            Skin Health Library
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight mb-4">
            Understand Your Skin
          </h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed text-base">
            Short, evidence-based explanations for every skin condition SkinSight detects — including why each condition behaves differently in Malaysia's tropical climate and lifestyle context.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { icon: "menu_book",  label: "7 conditions covered" },
              { icon: "public",     label: "Malaysian context" },
              { icon: "science",    label: "Evidence-based" },
              { icon: "spa",        label: "Ingredient guidance" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter tabs ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(["all", ...CONDITION_ORDER] as (ConditionType | "all")[]).map(key => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-headline font-semibold transition-colors capitalize ${
                filter === key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {/* ── Condition articles ───────────────────────────────────────────── */}
        <div className="space-y-4 mb-16">
          {visible.map((condition) => (
            <ArticleCard
              key={condition}
              condition={condition}
              article={CONDITION_ARTICLES[condition]}
              defaultOpen={filter !== "all"}
            />
          ))}
        </div>

        {/* ── General Malaysian Climate Tips ──────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-2xl">wb_sunny</span>
            <h2 className="font-headline font-bold text-2xl text-on-surface">General Tips for Malaysian Climate</h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-8 max-w-2xl">
            Skincare routines designed for temperate climates often need adjustment for South-East Asia's year-round heat, UV intensity, and indoor-outdoor humidity swings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GENERAL_MY_TIPS.map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                </div>
                <h3 className="font-headline font-semibold text-sm text-on-surface mb-2">{title}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 md:p-10 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <h2 className="font-headline font-bold text-xl text-on-surface mb-2">
              Ready to analyse your skin?
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Run a scan and SkinSight will automatically surface the articles most relevant to your detected conditions — right in your results report.
            </p>
          </div>
          <Link
            href="/scan"
            className="shrink-0 cta-gradient text-white font-headline font-bold px-8 py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          >
            Start a Scan
          </Link>
        </div>

        {/* ── Disclaimer ──────────────────────────────────────────────────── */}
        <p className="mt-10 text-xs text-on-surface-variant/60 leading-relaxed text-center max-w-2xl mx-auto">
          <span className="font-semibold">Educational disclaimer:</span> The articles in this library are intended to support skin health literacy and are not a substitute for professional medical advice. Always consult a qualified dermatologist or healthcare provider for diagnosis and treatment. SkinSight · {new Date().getFullYear()}
        </p>

      </main>
      <Footer />
    </>
  );
}
