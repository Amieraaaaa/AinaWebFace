"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeverityBadge from "@/components/SeverityBadge";
import { useSession } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ConditionScore {
  type: string;
  severity: "none" | "mild" | "moderate" | "severe";
  score: number;
}

interface ScanEntry {
  id: string;
  date: string;
  shortDate: string;
  score: number;
  label: string;
  conditions: ConditionScore[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

const CONDITION_COLORS: Record<string, string> = {
  acne:         "#ef4444",
  dryness:      "#3b82f6",
  oiliness:     "#10b981",
  pigmentation: "#8b5cf6",
  texture:      "#f59e0b",
  sensitivity:  "#ec4899",
  redness:      "#f97316",
};

const ALL_CONDITIONS = ["acne", "dryness", "oiliness", "pigmentation", "texture", "sensitivity", "redness"];

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ScoreTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-headline font-bold text-on-surface mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {Math.round(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { user } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"health" | "conditions">("health");
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from("skin_analyses")
      .select("analysis_id, overall_health_score, analysed_at, skin_condition_results(condition_type, severity_label, severity_score)")
      .eq("user_id", user.id)
      .order("analysed_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return;

        const entries: ScanEntry[] = data.map((row: any) => {
          const score = Math.round(row.overall_health_score);
          const rawDate = new Date(row.analysed_at);
          const conditions: ConditionScore[] = (row.skin_condition_results ?? []).map((c: any) => ({
            type: c.condition_type,
            severity: c.severity_label,
            score: Math.round(c.severity_score ?? 0),
          }));

          return {
            id: row.analysis_id,
            date: rawDate.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }),
            shortDate: rawDate.toLocaleDateString("en-MY", { day: "numeric", month: "short" }),
            score,
            label: healthLabel(score),
            conditions,
          };
        });

        setHistory(entries);
      });
  }, [user]);

  // Chart data — oldest first
  const chartData = [...history].reverse().map((s) => {
    const point: Record<string, any> = { date: s.shortDate, "Health Score": s.score };
    s.conditions.forEach((c) => { point[c.type] = c.score; });
    return point;
  });

  // Trend: compare latest to previous
  const delta =
    history.length >= 2
      ? history[0].score - history[1].score
      : null;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-32 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-on-surface-variant font-headline">Loading your history…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            Your Journey
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-background tracking-tight">
            Scan History
          </h1>
          <p className="text-on-surface-variant mt-2">Track your skin health progress over time.</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 block">history</span>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">No scans yet</h2>
            <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
              Complete your first skin scan to start tracking your progress.
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-8 py-4 cta-gradient text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">add_a_photo</span>
              Start First Scan
            </Link>
          </div>
        ) : (
          <>
            {/* ── Summary stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Total Scans</p>
                <p className="font-headline font-black text-3xl text-primary">{history.length}</p>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Latest Score</p>
                <p className="font-headline font-black text-3xl text-on-surface">{history[0].score}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{history[0].label}</p>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Since Last Scan</p>
                {delta !== null ? (
                  <p className={`font-headline font-black text-3xl ${delta > 0 ? "text-green-600" : delta < 0 ? "text-error" : "text-on-surface"}`}>
                    {delta > 0 ? "+" : ""}{delta}
                  </p>
                ) : (
                  <p className="font-headline font-black text-3xl text-on-surface-variant">—</p>
                )}
                {delta !== null && (
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {delta > 0 ? "Improving" : delta < 0 ? "Declining" : "No change"}
                  </p>
                )}
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Best Score</p>
                <p className="font-headline font-black text-3xl text-on-surface">
                  {Math.max(...history.map((h) => h.score))}
                </p>
              </div>
            </div>

            {/* ── Chart card ── */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm mb-10">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="font-headline font-bold text-lg text-on-surface">Progress Over Time</h2>
                <div className="flex rounded-xl overflow-hidden border border-outline-variant/30">
                  {(["health", "conditions"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs font-bold font-label uppercase tracking-wide transition-colors ${
                        activeTab === tab
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      {tab === "health" ? "Health Score" : "Conditions"}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "health" ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E36A6A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#E36A6A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0E4D0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9E7070" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9E7070" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ScoreTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Health Score"
                      stroke="#E36A6A"
                      strokeWidth={2.5}
                      fill="url(#healthGrad)"
                      dot={{ fill: "#E36A6A", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0E4D0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9E7070" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9E7070" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ScoreTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                    />
                    {ALL_CONDITIONS.map((condition) => (
                      <Line
                        key={condition}
                        type="monotone"
                        dataKey={condition}
                        name={condition.charAt(0).toUpperCase() + condition.slice(1)}
                        stroke={CONDITION_COLORS[condition]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {history.length < 3 && (
                <p className="text-center text-xs text-on-surface-variant mt-4">
                  Complete more scans to see meaningful trends — aim for weekly check-ins.
                </p>
              )}
            </div>

            {/* ── Scan list ── */}
            <h2 className="font-headline font-bold text-xl text-on-surface mb-4">All Scans</h2>
            <div className="space-y-3">
              {history.map((scan, i) => (
                <div
                  key={scan.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-headline font-black text-lg shrink-0 ${
                      scan.score >= 80 ? "bg-green-100 text-green-700" :
                      scan.score >= 60 ? "bg-blue-100 text-blue-700" :
                      scan.score >= 40 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {scan.score}
                    </div>
                    <div>
                      <p className="font-headline font-bold text-on-surface text-sm">{scan.date}</p>
                      <p className="text-xs text-on-surface-variant">{scan.label} · Scan #{history.length - i}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 flex-wrap">
                    {scan.conditions
                      .filter((c) => c.severity !== "none")
                      .slice(0, 3)
                      .map((c) => (
                        <SeverityBadge key={c.type} severity={c.severity} />
                      ))}
                  </div>
                  <button
                    onClick={() => { setViewingId(scan.id); router.push(`/results?id=${scan.id}`); }}
                    disabled={viewingId === scan.id}
                    className="text-primary font-bold text-sm hover:underline underline-offset-4 whitespace-nowrap disabled:opacity-60 shrink-0"
                  >
                    {viewingId === scan.id ? "Loading…" : "View →"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-8 py-4 cta-gradient text-on-primary rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">add_a_photo</span>
            New Scan
          </Link>
        </div>

      </main>
      <Footer />
    </>
  );
}
