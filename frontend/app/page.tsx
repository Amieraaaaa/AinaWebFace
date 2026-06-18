import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Data ──────────────────────────────────────────────────────────────────────

const HERO_CHIPS = [
  { icon: "psychology",      label: "7 Conditions Detected" },
  { icon: "verified",        label: "85%+ AI Accuracy" },
  { icon: "spa",             label: "Personalised Routine" },
  { icon: "mosque",          label: "Halal-Certified" },
];

const PILLARS = [
  {
    icon: "biotech",
    title: "AI Skin Detection",
    desc: "MobileNetV2 scans for 7 conditions — acne, dryness, oiliness, pigmentation, texture, sensitivity, and redness — each scored 0–100 in under 5 seconds.",
  },
  {
    icon: "recommend",
    title: "Personalised Routines",
    desc: "A hybrid recommendation engine builds a full AM/PM routine filtered by your budget tier, halal certification preference, and detected skin concerns.",
  },
  {
    icon: "menu_book",
    title: "Skin Health Library",
    desc: "Every detected condition surfaces evidence-based articles calibrated for Malaysia's tropical climate, UV levels, diet, and diverse skin tones.",
  },
];

const STEPS = [
  {
    icon: "add_a_photo",
    step: "01",
    title: "Take a Selfie",
    desc: "Upload a clear, well-lit photo of your face. Supports JPEG, PNG, and WEBP up to 10 MB — no account required for your first scan.",
  },
  {
    icon: "psychology",
    step: "02",
    title: "AI Analyses Your Skin",
    desc: "Our MobileNetV2 model detects 7 skin conditions with individual severity scores and an overall skin health score of 0–100.",
  },
  {
    icon: "spa",
    step: "03",
    title: "Get Your Routine",
    desc: "Receive a personalised AM/PM skincare plan with halal-certified products matched to your budget — from drugstore to premium.",
  },
];

const FEATURES = [
  {
    icon: "face_retouching_natural",
    title: "Fitzpatrick-Scale AI",
    desc: "Trained on stratified datasets across all 6 skin tone groups to ensure equitable accuracy for Malay, Chinese, and Indian skin tones.",
  },
  {
    icon: "lock",
    title: "Privacy-First",
    desc: "Images stored with AES-256 encryption in a private Supabase bucket. Row-Level Security ensures only you access your data.",
  },
  {
    icon: "history",
    title: "Progress Tracking",
    desc: "Re-scan every 4–6 weeks and track your skin health score over time. See measurable progress in your personal history log.",
  },
  {
    icon: "public",
    title: "Malaysian-Tailored",
    desc: "Skincare advice calibrated for South-East Asia's year-round UV index 8–11, 80%+ humidity, indoor air-con, and local dietary patterns.",
  },
  {
    icon: "local_hospital",
    title: "Doctor Referral Reports",
    desc: "If severe conditions are detected, SkinSight generates a printable referral report and recommends the right type of specialist.",
  },
  {
    icon: "science",
    title: "Ingredient Safety Rules",
    desc: "Our recommendation engine cross-checks ingredient interactions to avoid pairing actives that could irritate or counteract each other.",
  },
];

const STATS = [
  { value: "7",    unit: "",    label: "Skin conditions" },
  { value: "85",   unit: "%+",  label: "AI accuracy" },
  { value: "<5",   unit: "s",   label: "Analysis time" },
  { value: "100",  unit: "%",   label: "Privacy-first" },
];

const FAQS = [
  {
    q: "Is SkinSight as accurate as a real dermatologist?",
    a: "SkinSight is a screening tool, not a clinical device. It achieves ≥85% accuracy across 7 conditions and is designed to complement — not replace — clinical visits. Severe conditions always trigger a referral recommendation.",
  },
  {
    q: "Are product recommendations halal-certified?",
    a: "Yes. You can filter your routine by halal certification. All products in our catalogue are individually tagged, and the engine respects your preference strictly.",
  },
  {
    q: "Which skin conditions can SkinSight detect?",
    a: "Acne (with comedonal, inflammatory, or cystic subtypes), dryness, oiliness, pigmentation, texture irregularity, sensitivity, and redness — each with a 0–100 severity score.",
  },
  {
    q: "How is my photo stored and protected?",
    a: "Selfies are stored in a private Supabase Storage bucket with AES-256 encryption. Row-Level Security ensures your images are never visible to other users, and images are never shared with third parties.",
  },
  {
    q: "Who built SkinSight?",
    a: "SkinSight is a final-year research project at Management and Science University (MSU), Malaysia. It was developed to make dermatological screening accessible and affordable for university students.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ══════════════════════════════════════════════════════════════════
            WELCOME SCREEN — full-viewport first fold
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center pt-20 pb-16 px-6 md:px-8 overflow-hidden">

          {/* Decorative background blobs */}
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full opacity-20 -z-10"
            style={{ background: "radial-gradient(circle, #E36A6A 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10 -z-10"
            style={{ background: "radial-gradient(circle, #FFB2B2 0%, transparent 70%)" }}
          />
          {/* Dot grid */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, #E36A6A 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* ── Left: Welcome copy ─────────────────────────────────── */}
            <div className="lg:col-span-6 xl:col-span-7">

              {/* Logo mark */}
              <div className="flex items-center gap-3 mb-10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-[1rem] cta-gradient flex items-center justify-center shadow-xl">
                    <span className="material-symbols-outlined text-white text-[28px]">
                      face_retouching_natural
                    </span>
                  </div>
                  {/* Soft glow under logo */}
                  <div
                    className="absolute inset-0 rounded-[1rem] -z-10 scale-150 blur-xl opacity-40 cta-gradient"
                    aria-hidden
                  />
                </div>
                <span className="font-headline font-black text-2xl text-primary tracking-tighter">
                  SkinSight
                </span>
              </div>

              {/* Live badge */}
              <div className="inline-flex items-center gap-2 bg-primary-fixed text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                AI-Powered Skin Analysis · Free for Students
              </div>

              {/* Headline */}
              <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-black text-on-background leading-[1.05] tracking-tighter mb-6">
                See Your Skin{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
                >
                  Clearly.
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed mb-10 max-w-xl">
                SkinSight detects{" "}
                <span className="font-semibold text-on-surface">7 skin conditions</span> from a
                single selfie and builds a{" "}
                <span className="font-semibold text-on-surface">personalised AM/PM routine</span>{" "}
                — halal-certified, budget-friendly, and designed for Malaysian university students.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/scan"
                  className="cta-gradient text-white font-headline font-bold px-8 py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base"
                >
                  <span className="material-symbols-outlined text-xl">add_a_photo</span>
                  Start Free Analysis
                </Link>
                <Link
                  href="/about"
                  className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-outline-variant/40 text-on-surface rounded-xl font-headline font-bold text-base hover:bg-surface-container-low transition-colors"
                >
                  How It Works
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </Link>
              </div>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-3">
                {HERO_CHIPS.map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm"
                  >
                    <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right: Visual ─────────────────────────────────────── */}
            <div className="lg:col-span-6 xl:col-span-5 hidden lg:block relative">

              {/* Hero image */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/hero.jpg"
                  alt="SkinSight — AI skin analysis"
                  width={600}
                  height={560}
                  className="w-full h-[520px] object-cover"
                  priority
                />
                {/* Gradient overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating card — Health Score */}
              <div className="absolute -bottom-6 -left-8 bg-surface-container-lowest rounded-2xl px-5 py-4 shadow-2xl border border-outline-variant/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">favorite</span>
                </div>
                <div>
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-0.5">Skin Health Score</p>
                  <p className="font-headline font-black text-xl text-primary leading-none">82 <span className="text-sm font-semibold text-on-surface-variant">/ 100</span></p>
                </div>
              </div>

              {/* Floating card — Detected */}
              <div className="absolute -top-4 -right-6 bg-surface-container-lowest rounded-2xl px-5 py-4 shadow-2xl border border-outline-variant/20">
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Conditions Detected</p>
                <div className="flex gap-1.5 flex-wrap max-w-[160px]">
                  {["Acne", "Oiliness", "Dryness"].map((cond) => (
                    <span
                      key={cond}
                      className="text-[10px] font-bold bg-primary-fixed text-primary px-2 py-0.5 rounded-full"
                    >
                      {cond}
                    </span>
                  ))}
                  <span className="text-[10px] font-bold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                    +4 more
                  </span>
                </div>
              </div>

              {/* Floating card — Confidence */}
              <div className="absolute top-1/2 -left-10 -translate-y-1/2 bg-surface-container-lowest rounded-2xl px-4 py-3 shadow-xl border border-outline-variant/20 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                <div>
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">AI Confidence</p>
                  <p className="font-headline font-black text-lg text-primary leading-none">92%</p>
                </div>
              </div>
            </div>

          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-on-surface-variant/40 pointer-events-none">
            <span className="text-[10px] font-label uppercase tracking-[0.2em]">Explore</span>
            <span className="material-symbols-outlined text-xl animate-bounce">keyboard_arrow_down</span>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════════
            WHAT WE OFFER — 3 pillars
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 md:px-8">

            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
                What SkinSight Offers
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight mb-4">
                Everything Your Skin Needs
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                From AI-powered detection to personalised routines and evidence-based education — all in one platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10 group hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="w-14 h-14 cta-gradient rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-white text-2xl">{p.icon}</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-3">{p.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            STATS STRIP
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 border-y border-outline-variant/20">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map(({ value, unit, label }) => (
                <div key={label}>
                  <p className="font-headline font-black text-4xl md:text-5xl text-primary mb-1">
                    {value}
                    <span className="text-2xl">{unit}</span>
                  </p>
                  <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            HOW IT WORKS — 3 steps
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-8">
          <div className="max-w-7xl mx-auto">

            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
                How It Works
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight">
                Precision in Three Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line (desktop) */}
              <div
                aria-hidden
                className="hidden md:block absolute top-[3.5rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px border-t-2 border-dashed border-outline-variant/40"
              />

              {STEPS.map(({ icon, step, title, desc }) => (
                <div
                  key={step}
                  className="relative bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10 text-center group hover:-translate-y-1 transition-transform duration-300"
                >
                  {/* Step number */}
                  <span className="absolute top-4 right-5 font-headline font-black text-5xl text-primary/5 select-none">
                    {step}
                  </span>

                  <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-3">{title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FEATURE GRID — 6 cards
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-8 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">

            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
                Platform Features
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight mb-4">
                Built for Students. Backed by Science.
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Every feature was designed with Malaysian university students in mind — accessible, private, and genuinely useful.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex gap-4 group hover:border-primary/20 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-sm text-on-surface mb-1.5">{title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 md:px-8">
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
                FAQ
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight">
                Common Questions
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <div
                  key={q}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden"
                >
                  <details className="group">
                    <summary className="flex justify-between items-center gap-4 p-6 cursor-pointer list-none">
                      <span className="font-headline font-bold text-base text-on-surface">{q}</span>
                      <span className="material-symbols-outlined text-primary shrink-0 transition-transform duration-300 group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="px-6 pb-6 border-t border-outline-variant/10 pt-4">
                      <p className="text-sm text-on-surface-variant leading-relaxed">{a}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 px-6 md:px-8 pb-28 md:pb-16">
          <div className="max-w-7xl mx-auto">
            <div
              className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden px-8 py-20 md:py-28 text-center"
              style={{ background: "linear-gradient(135deg, #7A1515 0%, #E36A6A 40%, #FFB2B2 100%)" }}
            >
              {/* Background dot grid */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />

              {/* Glow orbs */}
              <div aria-hidden className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div aria-hidden className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-[0.875rem] bg-white/20 border border-white/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">face_retouching_natural</span>
                  </div>
                  <span className="font-headline font-black text-2xl text-white tracking-tighter">SkinSight</span>
                </div>

                <h2 className="font-headline text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                  Your Skin&apos;s Future,<br />Focused and Clear.
                </h2>
                <p className="text-white/70 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
                  Join Malaysian students taking control of their skin health journey — free, private, and backed by AI.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/scan"
                    className="bg-white text-primary font-headline font-black px-10 py-4 rounded-xl text-lg hover:bg-primary-fixed transition-colors shadow-2xl"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/learn"
                    className="flex items-center gap-2 text-white/80 hover:text-white font-headline font-bold text-base transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">menu_book</span>
                    Explore Skin Library
                  </Link>
                </div>

                {/* Trust chips */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
                  {["No credit card", "Halal-certified", "Encrypted & private", "MSU Research Project"].map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-3.5 py-1.5 rounded-full"
                    >
                      <span className="material-symbols-outlined text-sm text-white/60">check_circle</span>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
