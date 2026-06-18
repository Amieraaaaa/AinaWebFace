"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { useSession } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/client";
import { GENERAL_MY_TIPS } from "@/lib/skinEducation";
import type { SeverityLabel } from "@/types/analysis";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ConditionSnap {
  type: string;
  severity: SeverityLabel;
  score: number;
}

interface ScanRow {
  id: string;
  score: number;
  label: string;
  rawDate: string;
  conditions: ConditionSnap[];
  referral: boolean;
}

interface DashboardData {
  totalScans: number;
  latest: ScanRow | null;
  delta: number | null;
  bestScore: number;
  daysSinceLast: number | null;
  sparkline: { score: number; date: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function healthLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Poor";
}

function ringColor(s: number) {
  if (s >= 80) return "#16a34a";
  if (s >= 60) return "#2563eb";
  if (s >= 40) return "#d97706";
  return "#dc2626";
}

function textColor(s: number) {
  if (s >= 80) return "text-green-600";
  if (s >= 60) return "text-blue-600";
  if (s >= 40) return "text-amber-600";
  return "text-red-600";
}

function bgColor(s: number) {
  if (s >= 80) return "bg-green-50 border-green-200";
  if (s >= 60) return "bg-blue-50 border-blue-200";
  if (s >= 40) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CONDITION_ICON: Record<string, string> = {
  acne: "healing", dryness: "dry", oiliness: "water_drop",
  pigmentation: "tonality", texture: "texture",
  sensitivity: "sentiment_neutral", redness: "favorite",
};

const CONDITION_COLOR: Record<string, string> = {
  acne: "text-purple-600 bg-purple-50",
  dryness: "text-blue-600 bg-blue-50",
  oiliness: "text-cyan-600 bg-cyan-50",
  pigmentation: "text-orange-600 bg-orange-50",
  texture: "text-amber-600 bg-amber-50",
  sensitivity: "text-rose-600 bg-rose-50",
  redness: "text-red-600 bg-red-50",
};

const SEV_BAR: Record<SeverityLabel, string> = {
  none:     "#9ca3af",
  mild:     "#d97706",
  moderate: "#ea580c",
  severe:   "#dc2626",
};

const SEV_BADGE: Record<SeverityLabel, string> = {
  none:     "bg-surface-container text-on-surface-variant",
  mild:     "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  severe:   "bg-red-100 text-red-800",
};

const QUICK_LINKS = [
  { href: "/results",  icon: "biotech",          label: "Latest Analysis",  desc: "Your most recent scan report"     },
  { href: "/routine",  icon: "spa",               label: "My Routine",       desc: "AM/PM skincare steps & products"  },
  { href: "/history",  icon: "show_chart",        label: "Progress Charts",  desc: "Track health score over time"     },
  { href: "/learn",    icon: "menu_book",         label: "Skin Library",     desc: "Evidence-based condition guides"  },
  { href: "/profile",  icon: "manage_accounts",   label: "Skin Profile",     desc: "Preferences, allergies, budget"   },
];

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-32 rounded-3xl bg-white/60" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="h-56 rounded-3xl bg-white/60" />
          <div className="h-44 rounded-3xl bg-white/60" />
        </div>
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="h-64 rounded-3xl bg-white/60" />
          <div className="h-32 rounded-3xl bg-white/60" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const [data,      setData]      = useState<DashboardData | null>(null);
  const [fetchDone, setFetchDone] = useState(false);

  const firstName  = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-MY", { month: "long", year: "numeric" })
    : null;

  const todayTip = GENERAL_MY_TIPS[new Date().getDate() % GENERAL_MY_TIPS.length];

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("skin_analyses")
      .select(`analysis_id, overall_health_score, analysed_at, referral_recommended,
               skin_condition_results ( condition_type, severity_label, severity_score )`)
      .eq("user_id", user.id)
      .order("analysed_at", { ascending: false })
      .limit(12)
      .then(({ data: rows }) => {
        setFetchDone(true);
        if (!rows || rows.length === 0) {
          setData({ totalScans: 0, latest: null, delta: null, bestScore: 0, daysSinceLast: null, sparkline: [] });
          return;
        }
        const scans: ScanRow[] = (rows as any[]).map((r) => {
          const score = Math.round(r.overall_health_score);
          return {
            id: r.analysis_id, score, label: healthLabel(score), rawDate: r.analysed_at,
            referral: r.referral_recommended ?? false,
            conditions: (r.skin_condition_results ?? []).map((c: any) => ({
              type: c.condition_type, severity: c.severity_label as SeverityLabel,
              score: Math.round(c.severity_score ?? 0),
            })),
          };
        });
        const scores = scans.map((s) => s.score);
        setData({
          totalScans: scans.length,
          latest: scans[0],
          delta: scans.length >= 2 ? scores[0] - scores[1] : null,
          bestScore: Math.max(...scores),
          daysSinceLast: daysSince(scans[0].rawDate),
          sparkline: [...scans].reverse().map((s) => ({ score: s.score, date: fmtShort(s.rawDate) })),
        });
      });
  }, [user]);

  if (isLoading || !user) return <Skeleton />;
  if (!fetchDone)         return <Skeleton />;

  const d = data!;
  const hasScans = d.totalScans > 0;

  // Scan reminder
  let reminderText  = "Start your first scan";
  let reminderStyle = "bg-violet-100 text-violet-700";
  if (d.daysSinceLast !== null) {
    if      (d.daysSinceLast === 0)  { reminderText = "Scanned today";          reminderStyle = "bg-green-100 text-green-700"; }
    else if (d.daysSinceLast === 1)  { reminderText = "Scanned yesterday";       reminderStyle = "bg-green-100 text-green-700"; }
    else if (d.daysSinceLast < 7)    { reminderText = `${d.daysSinceLast}d ago`; reminderStyle = "bg-blue-100 text-blue-700";  }
    else if (d.daysSinceLast < 14)   { reminderText = "Check-in due";            reminderStyle = "bg-amber-100 text-amber-700"; }
    else                             { reminderText = "Overdue for a scan";       reminderStyle = "bg-red-100 text-red-700";    }
  }

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════════════════════
          GREETING BANNER — full width
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative rounded-2xl overflow-hidden px-7 py-6"
        style={{ background: "linear-gradient(135deg, #5C0000 0%, #8B2020 50%, #E36A6A 100%)" }}
      >
        {/* texture */}
        <div aria-hidden className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
        {/* glow */}
        <div aria-hidden className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/4"
          style={{ background: "#E36A6A" }} />

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/50 text-[11px] font-label uppercase tracking-widest mb-1.5">
              {new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="font-headline font-black text-2xl md:text-3xl text-white tracking-tight">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-white/55 text-sm mt-1">
              {memberSince ? `Member since ${memberSince} · ` : ""}{user.email}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${reminderStyle}`}>
              <span className="material-symbols-outlined text-sm">schedule</span>
              {reminderText}
            </span>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-headline font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add_a_photo</span>
              {hasScans ? "New Scan" : "First Scan"}
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════════════════════════════ */}
      {!hasScans && (
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/20 p-12 flex flex-col items-center text-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
          >
            <span className="material-symbols-outlined text-white text-4xl">document_scanner</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-2">No scans yet</h2>
            <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
              Take your first selfie to detect 7 skin conditions in under 5 seconds and unlock your personalised skincare routine.
            </p>
          </div>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 cta-gradient text-white font-headline font-bold px-8 py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">add_a_photo</span>
            Analyse My Skin
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MAIN GRID — two columns
      ══════════════════════════════════════════════════════════════════ */}
      {hasScans && d.latest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-5">

            {/* ─ Score + metrics ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">

              {/* card header strip */}
              <div className="px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                <p className="font-headline font-bold text-sm text-on-surface">Skin Health Overview</p>
                <Link href="/results" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  Full report <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">

                {/* Score ring */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="#FFF2D0" strokeWidth="11" />
                      <circle cx="60" cy="60" r="48" fill="none"
                        stroke={ringColor(d.latest.score)} strokeWidth="11"
                        strokeDasharray={`${(d.latest.score / 100) * 301.6} 301.6`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-headline font-black leading-none ${textColor(d.latest.score)}`}>
                        {d.latest.score}
                      </span>
                      <span className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant mt-1">/100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${bgColor(d.latest.score)}`}>
                      {d.latest.label}
                    </span>
                    <p className="text-[11px] text-on-surface-variant mt-1.5">{fmtDate(d.latest.rawDate)}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-3">

                  {/* Trend */}
                  <div className="rounded-xl p-4 bg-surface-container-low border border-outline-variant/10">
                    <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">vs Last Scan</p>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xl"
                        style={{ color: d.delta === null ? "#94a3b8" : d.delta > 0 ? "#16a34a" : d.delta < 0 ? "#dc2626" : "#94a3b8" }}>
                        {d.delta === null ? "remove" : d.delta > 0 ? "trending_up" : d.delta < 0 ? "trending_down" : "trending_flat"}
                      </span>
                      <p className={`font-headline font-black text-2xl leading-none ${
                        d.delta === null ? "text-on-surface-variant" : d.delta > 0 ? "text-green-600" : d.delta < 0 ? "text-red-600" : "text-on-surface-variant"
                      }`}>
                        {d.delta === null ? "—" : `${d.delta > 0 ? "+" : ""}${d.delta}`}
                      </p>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1.5">
                      {d.delta === null ? "Need 2+ scans" : d.delta > 0 ? "Improving" : d.delta < 0 ? "Needs attention" : "Steady"}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="rounded-xl p-4 bg-surface-container-low border border-outline-variant/10">
                    <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2">Total Scans</p>
                    <p className="font-headline font-black text-2xl text-primary leading-none">{d.totalScans}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1.5">Best: {d.bestScore}</p>
                  </div>

                  {/* Sparkline */}
                  <div className="col-span-2 rounded-xl p-4 bg-surface-container-low border border-outline-variant/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Score History</p>
                      <Link href="/history" className="text-[11px] text-primary font-semibold hover:underline">View all</Link>
                    </div>
                    <ResponsiveContainer width="100%" height={72}>
                      <AreaChart data={d.sparkline} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#E36A6A" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#E36A6A" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="bg-white border border-outline-variant/20 rounded-lg px-2 py-1 text-xs font-bold text-on-surface shadow-sm">
                              {payload[0].value}
                            </div>
                          ) : null
                        } />
                        <Area type="monotone" dataKey="score" stroke="#E36A6A" strokeWidth={2}
                          fill="url(#dGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Referral warning */}
              {d.latest.referral && (
                <div className="mx-6 mb-5 flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <span className="material-symbols-outlined text-red-500 text-lg shrink-0 mt-0.5">local_hospital</span>
                  <p className="text-xs text-red-700 leading-relaxed">
                    <span className="font-bold">Dermatologist referral recommended</span> based on your latest scan.{" "}
                    <Link href="/results" className="underline font-semibold">View referral report →</Link>
                  </p>
                </div>
              )}
            </div>

            {/* ─ Condition snapshot ──────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <div className="px-6 pt-5 pb-4 border-b border-outline-variant/10 flex items-center justify-between">
                <p className="font-headline font-bold text-sm text-on-surface">Latest Condition Snapshot</p>
                <Link href="/results" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  Full breakdown <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="p-6">
                {/* Condition icon pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {d.latest.conditions.map((c) => (
                    <div
                      key={c.type}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/20 ${
                        CONDITION_COLOR[c.type] ?? "text-on-surface bg-surface-container"
                      } bg-opacity-40`}
                    >
                      <span className="material-symbols-outlined text-sm">{CONDITION_ICON[c.type] ?? "spa"}</span>
                      <span className="text-xs font-semibold capitalize">{c.type}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SEV_BADGE[c.severity]}`}>
                        {c.severity}
                      </span>
                    </div>
                  ))}
                  {d.latest.conditions.length === 0 && (
                    <p className="text-sm text-on-surface-variant">No condition data for this scan.</p>
                  )}
                </div>

                {/* Severity bars — only non-none */}
                {d.latest.conditions.filter((c) => c.severity !== "none").length > 0 && (
                  <div className="space-y-3">
                    {d.latest.conditions
                      .filter((c) => c.severity !== "none")
                      .sort((a, b) => b.score - a.score)
                      .map((c) => (
                        <div key={c.type} className="flex items-center gap-3">
                          <span className="text-[11px] capitalize text-on-surface-variant font-medium w-[88px] shrink-0">{c.type}</span>
                          <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${c.score}%`, background: SEV_BAR[c.severity] }}
                            />
                          </div>
                          <span className="text-xs font-bold text-on-surface w-7 text-right shrink-0">{c.score}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* ─ Scan CTA ────────────────────────────────────────── */}
            <Link
              href="/scan"
              className="block rounded-2xl overflow-hidden group hover:opacity-95 transition-opacity shadow-sm"
              style={{ background: "linear-gradient(135deg, #5C0000 0%, #A32A2A 55%, #E36A6A 100%)" }}
            >
              <div aria-hidden className="absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
              <div className="relative p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-label uppercase tracking-widest text-white/50 mb-1">
                    {hasScans ? `Last scan · ${fmtDate(d.latest.rawDate)}` : "Get started"}
                  </p>
                  <h3 className="font-headline font-extrabold text-lg text-white mb-1">
                    {hasScans ? "Start a New Scan" : "Analyse My Skin"}
                  </h3>
                  <p className="text-white/65 text-sm">
                    {hasScans ? "Re-scan every 4–6 weeks to track improvement." : "Detect 7 conditions in under 5 seconds."}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                </div>
              </div>
            </Link>

          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-5">

            {/* ─ Quick Access ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <div className="px-5 pt-5 pb-3 border-b border-outline-variant/10">
                <p className="font-headline font-bold text-sm text-on-surface">Quick Access</p>
              </div>
              <div className="p-3 space-y-1">
                {QUICK_LINKS.map(({ href, icon, label, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-low group transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-bold text-sm text-on-surface leading-tight">{label}</p>
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-lg shrink-0">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ─ Tip of the day ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              {/* Coloured top strip */}
              <div
                className="h-1.5 w-full"
                style={{ background: "linear-gradient(90deg, #E36A6A 0%, #FFB2B2 100%)" }}
              />
              <div className="px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[17px]">{todayTip.icon}</span>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface leading-tight">{todayTip.title}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Tip of the day</span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{todayTip.body}</p>
                <Link href="/learn" className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  Read more in Skin Library
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* ─ Account summary ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 p-5">
              <p className="font-headline font-bold text-sm text-on-surface mb-4">Account Summary</p>
              <div className="space-y-3">
                {[
                  { icon: "person",         label: "Name",         value: user.user_metadata?.full_name ?? "—" },
                  { icon: "mail",           label: "Email",        value: user.email ?? "—" },
                  { icon: "calendar_today", label: "Member since", value: memberSince ?? "—" },
                  { icon: "history",        label: "Total scans",  value: String(d.totalScans) },
                  { icon: "star",           label: "Best score",   value: d.bestScore ? `${d.bestScore} / 100` : "—" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[17px] w-5 shrink-0">{icon}</span>
                    <span className="text-xs text-on-surface-variant w-24 shrink-0">{label}</span>
                    <span className="text-xs font-semibold text-on-surface truncate">{value}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/profile"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-outline-variant/30 text-xs font-headline font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                Edit Profile
              </Link>
            </div>

            {/* ─ Disclaimer ──────────────────────────────────────── */}
            <div className="flex items-start gap-3 p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0 mt-0.5">info</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                <span className="font-bold text-on-surface">Non-clinical tool.</span>{" "}
                SkinSight is a screening aid, not a medical diagnosis. Always consult a qualified dermatologist for clinical concerns.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Empty state below-fold quick links */}
      {!hasScans && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map(({ href, icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-outline-variant/10 hover:-translate-y-0.5 hover:border-primary/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-sm text-on-surface">{label}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
              </div>
              <span className="material-symbols-outlined text-outline text-xl shrink-0">chevron_right</span>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
