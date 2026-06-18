import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen">

        {/* Hero */}
        <section className="px-8 max-w-7xl mx-auto py-20">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
              About SkinSight
            </span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-primary leading-[1.1] tracking-tight mb-8">
              AI Skincare for <br />Malaysian Students
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed mb-6">
              SkinSight is a final year research project at Management and Science University (MSU).
              It bridges the gap between expensive clinical dermatology and the absence of affordable,
              personalised skincare guidance for university students.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Using a MobileNetV2 convolutional neural network, SkinSight detects 7 skin conditions
              from a selfie, then generates a personalised AM/PM routine filtered by budget tier,
              halal certification, and your lifestyle profile.
            </p>
          </div>
        </section>

        {/* Objectives */}
        <section className="bg-surface-container-low py-20 px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-3xl font-extrabold text-primary mb-12 tracking-tight">
              Project Objectives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "psychology", title: "AI Accuracy ≥ 85%", desc: "MobileNetV2 trained on stratified Fitzpatrick-scale datasets to detect 7 skin conditions." },
                { icon: "recommend", title: "Personalised Routines", desc: "Hybrid recommendation engine with ingredient safety rules, halal filters, and budget tiers." },
                { icon: "accessibility", title: "Stigma-Free UX", desc: "SUS score target ≥ 75. Designed to feel safe, private, and empowering for students." },
                { icon: "balance", title: "Bias-Aware AI", desc: "Fitzpatrick parity gap target < 10% across all 6 skin tone groups." },
                { icon: "lock", title: "Privacy-First", desc: "Explicit consent before upload. Supabase RLS ensures every student sees only their own data." },
                { icon: "science", title: "Rigorous Evaluation", desc: "Full confusion matrix per condition, benchmarked against 3 existing commercial apps." },
              ].map((obj) => (
                <div key={obj.title} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
                  <span className="material-symbols-outlined text-primary text-3xl mb-4 block">{obj.icon}</span>
                  <h3 className="font-headline font-bold text-on-surface mb-2">{obj.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{obj.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="py-20 px-8 max-w-7xl mx-auto">
          <h2 className="font-headline text-3xl font-extrabold text-primary mb-12 tracking-tight">
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { layer: "Frontend", tech: "Next.js 14 + Tailwind CSS" },
              { layer: "Backend", tech: "FastAPI + Python 3.11" },
              { layer: "Database", tech: "Supabase (PostgreSQL 15)" },
              { layer: "AI/ML", tech: "TensorFlow + MobileNetV2" },
            ].map((item) => (
              <div key={item.layer} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border-t-4 border-primary">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant font-label mb-2">{item.layer}</p>
                <p className="font-headline font-bold text-on-surface">{item.tech}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="px-8 max-w-7xl mx-auto pb-12">
          <div className="bg-error-container rounded-2xl p-6 flex gap-4 items-start">
            <span className="material-symbols-outlined text-on-error-container text-2xl mt-0.5">warning</span>
            <div>
              <h3 className="font-headline font-bold text-on-error-container mb-1">Medical Disclaimer</h3>
              <p className="text-sm text-on-error-container leading-relaxed">
                SkinSight is a non-clinical screening tool and does not replace a qualified dermatologist.
                Any skin condition flagged as severe should be reviewed by a licensed medical professional.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-8 max-w-7xl mx-auto pb-20 text-center">
          <Link href="/scan" className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-bold text-xl shadow-lg hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">add_a_photo</span>
            Try SkinSight Free
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
