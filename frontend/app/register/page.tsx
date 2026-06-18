"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

function friendlyError(msg: string): string {
  if (msg.includes("User already registered") || msg.includes("already been registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (msg.includes("Password should be at least"))
    return "Password must be at least 6 characters.";
  if (msg.includes("Unable to validate email address"))
    return "Please enter a valid email address.";
  if (msg.includes("Signup requires a valid password"))
    return "Please enter a valid password.";
  return msg;
}

export default function RegisterPage() {
  const [fullName,        setFullName]        = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error,           setError]           = useState<string | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [verifyPending,   setVerifyPending]   = useState(false);

  const router   = useRouter();
  const supabase = createClient();

  // ── Email / password sign-up ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Passed to handle_new_user trigger via raw_user_meta_data
        data: { full_name: fullName.trim() || null },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(friendlyError(error.message));
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled in Supabase — session created immediately
      router.push("/dashboard");
      router.refresh();
    } else {
      // Supabase sent a confirmation email — show verify screen
      setVerifyPending(true);
      setLoading(false);
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(friendlyError(error.message));
  };

  // ── Verify email pending screen ─────────────────────────────────────────
  if (verifyPending) {
    return (
      <div className="min-h-screen editorial-gradient-bg flex flex-col bg-surface font-body text-on-surface">
        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-fixed mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">mark_email_unread</span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-3">Check your email</h1>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              We sent a confirmation link to <span className="font-bold text-on-surface">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Go to Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen editorial-gradient-bg flex flex-col bg-surface font-body text-on-surface">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container mb-4 shadow-sm">
              <span className="material-symbols-outlined text-white text-2xl">clinical_notes</span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-primary">SkinSight</h1>
            <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest mt-2">
              AI Skin Analysis
            </p>
          </div>

          {/* Card */}
          <div className="bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-[0_20px_40px_rgba(25,28,30,0.06)] border border-outline-variant/10">
            <div className="mb-8">
              <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Create Account</h2>
              <p className="text-on-surface-variant text-sm mt-1">Free for all Malaysian university students.</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-error-container rounded-xl">
                <span className="material-symbols-outlined text-error text-[18px] mt-0.5 shrink-0">error</span>
                <p className="text-on-error-container text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Noraina Suria Amiera"
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint/40 transition-all duration-200 outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu.my"
                  required
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint/40 transition-all duration-200 outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint/40 transition-all duration-200 outline-none"
                />
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint/40 transition-all duration-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cta-gradient text-white font-headline font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-surface-container-lowest px-4 text-on-surface-variant font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 bg-surface-container-low border border-outline-variant/30 text-on-surface font-medium py-3 rounded-xl hover:bg-surface-container-high transition-colors active:scale-[0.98] duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>

            <p className="text-center mt-8 text-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline decoration-2 underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 opacity-40 hover:opacity-100 transition-all duration-500">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span className="text-[10px] font-label uppercase tracking-tighter">PDPA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span className="text-[10px] font-label uppercase tracking-tighter">AES-256 Encrypted</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
