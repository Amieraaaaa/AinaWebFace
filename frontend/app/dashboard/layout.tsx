"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";

const NAV_MAIN = [
  { href: "/dashboard",  icon: "dashboard",         label: "Dashboard"  },
  { href: "/scan",       icon: "document_scanner",  label: "New Scan"   },
  { href: "/results",    icon: "biotech",            label: "Analysis"   },
  { href: "/routine",    icon: "spa",                label: "My Routine" },
  { href: "/history",    icon: "show_chart",         label: "History"    },
];

const NAV_RESOURCES = [
  { href: "/learn",    icon: "menu_book",        label: "Skin Library" },
  { href: "/profile",  icon: "manage_accounts",  label: "Profile"      },
];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "S";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { user, signOut } = useSession();

  const displayName  = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Student";
  const userInitials = getInitials(displayName);
  const currentLabel = [...NAV_MAIN, ...NAV_RESOURCES].find((i) => i.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen flex" style={{ background: "#FFF8EE" }}>

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR — dark branded
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 fixed h-full z-40 overflow-hidden"
        style={{ background: "linear-gradient(175deg, #5C0000 0%, #7A1515 35%, #8B2020 75%, #A32A2A 100%)" }}
      >
        {/* Subtle dot-grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px",
          }}
        />
        {/* Top purple glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-10 w-52 h-52 rounded-full opacity-20 blur-3xl"
          style={{ background: "#FFB2B2" }}
        />

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div className="relative px-5 py-5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
            >
              <span className="material-symbols-outlined text-white text-[18px]">
                face_retouching_natural
              </span>
            </div>
            <div>
              <p className="font-headline font-black text-[17px] text-white tracking-tighter leading-none">
                SkinSight
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.18em] mt-0.5 font-label">
                Student Dashboard
              </p>
            </div>
          </Link>
        </div>

        {/* ── New Scan CTA ──────────────────────────────────────────────── */}
        <div className="relative px-4 pt-4 pb-2">
          <Link
            href="/scan"
            className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl text-white font-headline font-bold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
          >
            <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            New Scan
            <span className="ml-auto material-symbols-outlined text-[16px] opacity-70">arrow_forward</span>
          </Link>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav className="relative flex-1 px-3 py-2 overflow-y-auto space-y-0.5">

          {NAV_MAIN.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-headline font-bold text-sm transition-all duration-150 ${
                  active
                    ? "bg-white/15 text-white backdrop-blur-sm"
                    : "text-white/55 hover:bg-white/8 hover:text-white/90"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />}
              </Link>
            );
          })}

          <div className="px-4 pt-5 pb-1">
            <p className="text-[10px] font-label uppercase tracking-[0.18em] text-white/25">
              Resources
            </p>
          </div>

          {NAV_RESOURCES.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-headline font-bold text-sm transition-all duration-150 ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:bg-white/8 hover:text-white/90"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* ── User footer ──────────────────────────────────────────────── */}
        <div className="relative px-4 py-4 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/8">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-headline font-black text-sm text-white shadow"
              style={{ background: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
            >
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-xs leading-tight truncate">{displayName}</p>
              <p className="text-[10px] text-white/40 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-white/40 hover:bg-white/10 hover:text-white/70 font-headline font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3.5 sticky top-0 z-30 border-b border-white/10"
          style={{ background: "linear-gradient(135deg, #7A1515 0%, #A32A2A 100%)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
            >
              <span className="material-symbols-outlined text-white text-[16px]">face_retouching_natural</span>
            </div>
            <div>
              <p className="font-headline font-black text-base text-white tracking-tighter leading-none">SkinSight</p>
              <p className="text-[10px] text-white/50 font-label">{currentLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/scan"
              className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl"
              style={{ background: "linear-gradient(135deg, #E36A6A 0%, #C45252 100%)" }}
            >
              <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
              Scan
            </Link>
            <button
              onClick={signOut}
              className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-7 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
