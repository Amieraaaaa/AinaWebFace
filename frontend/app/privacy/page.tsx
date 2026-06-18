import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Privacy Policy — SkinSight" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen">

        {/* Header */}
        <section className="px-8 max-w-4xl mx-auto py-16">
          <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            Legal
          </span>
          <h1 className="font-headline text-5xl font-extrabold text-primary leading-tight tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant">
            Last updated: <strong>1 May 2025</strong> &nbsp;·&nbsp; Effective immediately
          </p>
        </section>

        {/* Content */}
        <section className="px-8 max-w-4xl mx-auto space-y-12">

          {/* Intro */}
          <div className="bg-primary-fixed/40 border border-primary/20 rounded-2xl p-6">
            <p className="text-on-surface leading-relaxed">
              SkinSight (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;) is a final-year research project at
              Management and Science University (MSU), Malaysia. We are committed to protecting your
              personal data in compliance with the <strong>Personal Data Protection Act 2010 (PDPA Malaysia)</strong>.
              This policy explains what data we collect, how we use it, and your rights.
            </p>
          </div>

          <PolicySection icon="person" title="1. Who We Are">
            <p>
              SkinSight is operated by <strong>Noraina Suria Amiera Norazman</strong> as part of a
              Bachelor of Computer Science (Honours) final year project at Management and Science
              University (MSU), Shah Alam, Malaysia.
            </p>
            <p className="mt-3">
              Contact:{" "}
              <a href="mailto:suria.amiera28@gmail.com" className="text-primary underline underline-offset-4">
                suria.amiera28@gmail.com
              </a>
            </p>
          </PolicySection>

          <PolicySection icon="database" title="2. Data We Collect">
            <Table
              headers={["Category", "Examples", "Purpose"]}
              rows={[
                ["Account data", "Name, email address, password hash", "Authentication and profile creation"],
                ["Profile data", "Skin type, Fitzpatrick scale, stress level, diet, sleep hours, known allergies", "Personalising skin recommendations"],
                ["Facial images", "Selfies uploaded for analysis (JPEG/PNG/WEBP)", "AI skin condition detection"],
                ["Analysis results", "Condition severity scores, health score, acne subtype", "Displaying results and progress tracking"],
                ["Usage data", "Pages visited, scan timestamps, routine ratings", "Improving the service"],
                ["Device data", "Browser type, OS, IP address (anonymised)", "Security and fraud prevention"],
              ]}
            />
          </PolicySection>

          <PolicySection icon="how_to_reg" title="3. Legal Basis for Processing">
            <ul className="space-y-3">
              {[
                ["Consent", "You give explicit consent before uploading any facial image. You may withdraw consent at any time by deleting your account."],
                ["Legitimate interest", "We process usage data to improve accuracy and fix bugs."],
                ["Legal obligation", "We may retain certain logs if required by Malaysian law."],
              ].map(([basis, desc]) => (
                <li key={basis as string} className="flex gap-3">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">check_circle</span>
                  <span><strong>{basis}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
          </PolicySection>

          <PolicySection icon="storage" title="4. How We Store Your Data">
            <p>All data is stored on <strong>Supabase Cloud</strong> (hosted on AWS, Singapore region).</p>
            <ul className="mt-4 space-y-2">
              {[
                "Facial images are stored in a private Supabase Storage bucket with AES-256 encryption at rest.",
                "All data in transit is protected by TLS 1.3 (HTTPS only).",
                "Row Level Security (RLS) is enforced — you can only access your own records.",
                "Passwords are never stored. Authentication is handled entirely by Supabase Auth.",
                "Backups are retained for 7 days.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">shield</span>
                  {item}
                </li>
              ))}
            </ul>
          </PolicySection>

          <PolicySection icon="share" title="5. Data Sharing">
            <p className="mb-4">We <strong>do not sell</strong> your personal data. We share data only in these limited circumstances:</p>
            <Table
              headers={["Recipient", "What is shared", "Why"]}
              rows={[
                ["Supabase Inc.", "All user data (processed on their infrastructure)", "Cloud database and auth provider"],
                ["Research supervisors at MSU", "Anonymised, aggregated statistics only", "Academic evaluation of the FYP"],
                ["Malaysian authorities", "Legally required data only", "Compliance with PDPA and court orders"],
              ]}
            />
            <p className="mt-4 text-sm text-on-surface-variant">
              No facial images are ever shared with third parties, advertisers, or marketing companies.
            </p>
          </PolicySection>

          <PolicySection icon="timer" title="6. Data Retention">
            <ul className="space-y-2">
              {[
                ["Active account", "All data retained while your account is active."],
                ["Deleted account", "Personal data soft-deleted immediately; hard-deleted from Storage within 30 days."],
                ["Anonymised research data", "Aggregated, non-identifiable statistics may be retained for academic publication."],
                ["Audit logs", "System logs retained for 90 days for security monitoring."],
              ].map(([period, desc]) => (
                <li key={period as string} className="flex gap-3 text-sm">
                  <span className="font-bold text-primary w-48 shrink-0">{period}</span>
                  <span className="text-on-surface-variant">{desc}</span>
                </li>
              ))}
            </ul>
          </PolicySection>

          <PolicySection icon="policy" title="7. Your Rights (PDPA Malaysia)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: "visibility", right: "Access", desc: "Request a copy of all data we hold about you." },
                { icon: "edit", right: "Correction", desc: "Ask us to correct inaccurate personal data." },
                { icon: "delete", right: "Erasure", desc: "Delete your account — all data removed within 30 days." },
                { icon: "block", right: "Objection", desc: "Object to specific processing activities." },
                { icon: "download", right: "Portability", desc: "Export your scan history as JSON." },
                { icon: "undo", right: "Withdraw consent", desc: "Revoke image upload consent at any time." },
              ].map((r) => (
                <div key={r.right} className="bg-surface-container-low rounded-xl p-4 flex gap-3">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">{r.icon}</span>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{r.right}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              To exercise any right, email{" "}
              <a href="mailto:suria.amiera28@gmail.com" className="text-primary underline">
                suria.amiera28@gmail.com
              </a>{" "}
              from your registered address. We will respond within <strong>14 days</strong>.
            </p>
          </PolicySection>

          <PolicySection icon="cookie" title="8. Cookies">
            <p>
              We use only essential cookies for authentication (managed by Supabase Auth). We do{" "}
              <strong>not</strong> use tracking, advertising, or analytics cookies.
            </p>
          </PolicySection>

          <PolicySection icon="child_care" title="9. Age Restriction">
            <p>
              SkinSight is designed for university students (18 years and older). We do not knowingly
              collect data from anyone under 18. If you believe a minor has registered, contact us
              immediately for account removal.
            </p>
          </PolicySection>

          <PolicySection icon="update" title="10. Policy Updates">
            <p>
              We may update this policy as the project evolves. Significant changes will be announced
              via the email address on your account at least <strong>7 days</strong> before taking effect.
              Continued use after the effective date constitutes acceptance.
            </p>
          </PolicySection>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Contact Us
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-outline-variant/30 text-primary rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
              About SkinSight
            </Link>
          </div>

        </section>
      </main>
      <Footer />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PolicySection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        <h2 className="font-headline text-xl font-bold text-on-surface">{title}</h2>
      </div>
      <div className="text-on-surface-variant leading-relaxed pl-9">
        {children}
      </div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-surface-container-low">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-bold text-on-surface border-b border-outline-variant/30 first:rounded-tl-xl last:rounded-tr-xl">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-on-surface-variant align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
