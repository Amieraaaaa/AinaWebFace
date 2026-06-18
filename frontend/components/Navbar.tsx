"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";

const navLinks = [
  { href: "/",        label: "Home" },
  { href: "/scan",    label: "Scan" },
  { href: "/results", label: "Analysis" },
  { href: "/routine", label: "Routine" },
  { href: "/history", label: "History" },
  { href: "/learn",   label: "Learn" },
  { href: "/about",   label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useSession();

  return (
    <>
      {/* Desktop Navbar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 glass-header shadow-sm">
        <nav className="flex justify-between items-center px-8 py-4 w-full max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-black text-primary tracking-tighter font-headline">
            SkinSight
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-headline tracking-tight font-bold transition-colors ${
                  pathname === link.href
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-primary-fixed text-primary rounded-xl font-bold text-sm hover:bg-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex items-center px-4 py-2 border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden md:inline-flex items-center px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Register
                </Link>
              </>
            )}
            <Link href={user ? "/dashboard" : "/profile"}>
              <span className="material-symbols-outlined text-primary text-2xl cursor-pointer">
                account_circle
              </span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-surface rounded-t-3xl shadow-[0_-10px_30px_rgba(25,28,30,0.04)] z-50">
        {[
          { href: "/",          icon: "home",             label: "Home" },
          { href: "/scan",      icon: "document_scanner", label: "Scan" },
          { href: "/learn",     icon: "menu_book",        label: "Learn" },
          { href: "/routine",   icon: "spa",              label: "Routine" },
          { href: user ? "/dashboard" : "/login", icon: user ? "dashboard" : "login", label: user ? "Dashboard" : "Sign In" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-5 py-2 rounded-xl transition-all ${
              pathname === item.href
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-xs font-medium uppercase tracking-widest mt-1">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
