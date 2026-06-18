"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FAQS = [
  {
    q: "My scan keeps failing — what should I do?",
    a: "Ensure your face is clearly visible, well-lit (natural light works best), and centred in the frame. Avoid heavy shadows, glasses glare, or a blurry image. If the problem persists, try uploading a photo instead of using the live camera.",
  },
  {
    q: "My session keeps expiring — I keep getting signed out.",
    a: "Supabase access tokens expire after 1 hour. Sign out fully from the navbar, then sign back in to get a fresh token. If it happens repeatedly, clear your browser cookies and try again.",
  },
  {
    q: "The recommendations don't match my skin type.",
    a: "Go to your Profile page and make sure your skin type, Fitzpatrick scale, and known allergies are filled in correctly. Incomplete profiles receive lower recommendation match scores.",
  },
  {
    q: "I want to delete all my data.",
    a: "Go to Profile → Account Settings → Delete Account. All personal data is soft-deleted immediately and hard-deleted from storage within 30 days, in line with our Privacy Policy.",
  },
  {
    q: "Is SkinSight available as a mobile app?",
    a: "Not yet. SkinSight is currently a web application optimised for mobile browsers. A native app is not in scope for this FYP, but the site works well on any smartphone browser.",
  },
  {
    q: "Can I use SkinSight if I have a serious skin condition?",
    a: "SkinSight is a screening tool only. If you have a diagnosed condition (eczema, rosacea, psoriasis, etc.) or a condition flagged as severe by our system, please consult a dermatologist before acting on any recommendation.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setStatus("sending");
    // Simulates sending — replace with a real email API (e.g. Resend, EmailJS) when ready
    await new Promise((res) => setTimeout(res, 1400));
    setStatus("sent");
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen">

        {/* Header */}
        <section className="px-8 max-w-7xl mx-auto py-16">
          <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            Support
          </span>
          <h1 className="font-headline text-5xl font-extrabold text-primary leading-tight tracking-tight mb-4">
            Contact Support
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl">
            Having trouble or a question? Check the FAQs below or send us a message —
            we usually respond within <strong>1–2 business days</strong>.
          </p>
        </section>

        <section className="px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── Contact form ── */}
          <div className="lg:col-span-3">
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-6">Send a Message</h2>

              {status === "sent" ? (
                <div className="flex flex-col items-center text-center py-12 gap-4">
                  <span className="material-symbols-outlined text-primary text-6xl">mark_email_read</span>
                  <h3 className="font-headline font-bold text-xl text-on-surface">Message sent!</h3>
                  <p className="text-on-surface-variant max-w-sm">
                    Thanks for reaching out. We&apos;ll get back to you at <strong>{form.email || "your email"}</strong> within 1–2 business days.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-4 px-6 py-3 border-2 border-outline-variant/30 text-primary rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Your name *" name="name" type="text"
                      placeholder="Noraina Suria" value={form.name} onChange={handleChange} />
                    <Field label="Email address *" name="email" type="email"
                      placeholder="you@example.com" value={form.email} onChange={handleChange} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Subject</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-outline-variant/30 rounded-xl text-sm text-on-surface bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition"
                    >
                      <option value="">Select a topic…</option>
                      <option value="scan-issue">Scan or analysis issue</option>
                      <option value="account">Account or login problem</option>
                      <option value="recommendation">Recommendation feedback</option>
                      <option value="privacy">Privacy or data request</option>
                      <option value="bug">Bug report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe your issue or question in as much detail as possible…"
                      className="w-full px-4 py-3 border-2 border-outline-variant/30 rounded-xl text-sm text-on-surface bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending" || !form.name || !form.email || !form.message}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Direct contact */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-5">Direct Contact</h2>
              <div className="space-y-4">
                {[
                  { icon: "mail", label: "Email", value: "suria.amiera28@gmail.com", href: "mailto:suria.amiera28@gmail.com" },
                  { icon: "school", label: "Institution", value: "Management and Science University (MSU), Shah Alam", href: null },
                  { icon: "schedule", label: "Response time", value: "1–2 business days", href: null },
                ].map(({ icon, label, value, href }) => (
                  <div key={label} className="flex gap-3 items-start">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">{icon}</span>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm font-bold text-primary underline underline-offset-2">{value}</a>
                      ) : (
                        <p className="text-sm font-bold text-on-surface">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
              <h2 className="font-headline font-bold text-on-surface mb-4">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { href: "/privacy", icon: "policy", label: "Privacy Policy" },
                  { href: "/disclaimer", icon: "medical_information", label: "Medical Disclaimer" },
                  { href: "/about", icon: "info", label: "About SkinSight" },
                  { href: "/scan", icon: "add_a_photo", label: "Start a New Scan" },
                ].map(({ href, icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium text-on-surface"
                  >
                    <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
                    {label}
                    <span className="material-symbols-outlined text-outline text-[16px] ml-auto">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-8 max-w-4xl mx-auto mt-20">
          <h2 className="font-headline text-3xl font-extrabold text-primary mb-10 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-headline font-bold text-on-surface text-sm md:text-base">{faq.q}</span>
                  <span className={`material-symbols-outlined text-primary text-xl shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/20 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

function Field({ label, name, type, placeholder, value, onChange }: {
  label: string; name: string; type: string;
  placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-on-surface mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 border-2 border-outline-variant/30 rounded-xl text-sm text-on-surface bg-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition"
      />
    </div>
  );
}
