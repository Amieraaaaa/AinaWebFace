import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Medical Disclaimer — SkinSight" };

export default function DisclaimerPage() {
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
            Medical Disclaimer
          </h1>
          <p className="text-on-surface-variant">
            Last updated: <strong>1 May 2025</strong>
          </p>
        </section>

        {/* Critical warning banner */}
        <section className="px-8 max-w-4xl mx-auto mb-12">
          <div className="bg-error-container rounded-2xl p-6 flex gap-4 items-start border border-error/20">
            <span className="material-symbols-outlined text-error text-3xl mt-0.5 shrink-0">emergency</span>
            <div>
              <h2 className="font-headline font-bold text-on-error-container text-lg mb-2">
                Not a Medical Device
              </h2>
              <p className="text-on-error-container leading-relaxed">
                <strong>SkinSight is not a medical device and does not provide medical advice,
                diagnosis, or treatment.</strong> It is a research and educational tool developed as
                part of a university final year project. Always consult a qualified dermatologist or
                healthcare professional for any skin health concern.
              </p>
            </div>
          </div>
        </section>

        {/* Emergency callout */}
        <section className="px-8 max-w-4xl mx-auto mb-12">
          <div className="bg-surface-container-low rounded-2xl p-6 border-l-4 border-secondary">
            <h2 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">local_hospital</span>
              Seek Immediate Professional Help If You Experience:
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {[
                "Rapidly spreading rash or hives",
                "Severe swelling of the face, lips, or throat",
                "Difficulty breathing alongside skin symptoms",
                "Signs of skin infection (pus, extreme heat, fever)",
                "Sudden unexplained changes in moles or lesions",
                "Painful blisters covering large areas of skin",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-error text-base mt-0.5 shrink-0">priority_high</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-bold text-on-surface">
              In a medical emergency, call <span className="text-secondary">999</span> (Malaysia) or go to your nearest A&amp;E immediately.
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="px-8 max-w-4xl mx-auto space-y-10">

          <DisclaimerSection icon="science" title="1. Nature of This Tool">
            <p>
              SkinSight uses a <strong>MobileNetV2 convolutional neural network</strong> trained on
              publicly available dermatological datasets to detect patterns associated with seven skin
              conditions. The AI model:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Analyses visual patterns in uploaded photographs only",
                "Cannot examine skin texture, temperature, or medical history",
                "Cannot access laboratory results, biopsies, or clinical records",
                "Cannot account for systemic illnesses that may present on the skin",
                "Has been validated on a held-out test set but has not undergone clinical trials",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">info</span>
                  {item}
                </li>
              ))}
            </ul>
          </DisclaimerSection>

          <DisclaimerSection icon="bar_chart" title="2. Accuracy and Limitations">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="text-left px-4 py-3 font-bold text-on-surface border-b border-outline-variant/30 rounded-tl-xl">Condition</th>
                    <th className="text-left px-4 py-3 font-bold text-on-surface border-b border-outline-variant/30">Target Accuracy</th>
                    <th className="text-left px-4 py-3 font-bold text-on-surface border-b border-outline-variant/30 rounded-tr-xl">Limitation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Acne", "≥ 85%", "Cannot distinguish hormonal vs dietary acne causes"],
                    ["Dryness", "≥ 85%", "Photo lighting significantly affects detection"],
                    ["Oiliness", "≥ 85%", "Time of day and skin prep affect sebum visibility"],
                    ["Pigmentation", "≥ 85%", "Flash photography may mask or exaggerate patches"],
                    ["Texture", "≥ 85%", "Requires close-up, well-lit photo for accuracy"],
                    ["Sensitivity", "≥ 85%", "Cannot detect internal triggers (allergies, diet)"],
                    ["Redness", "≥ 85%", "Rosacea requires clinical diagnosis beyond AI scope"],
                  ].map(([cond, acc, limit]) => (
                    <tr key={cond} className="border-b border-outline-variant/20 hover:bg-surface-container-low/50">
                      <td className="px-4 py-3 font-medium text-on-surface">{cond}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{acc}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{limit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              Target accuracy figures represent design objectives. Actual performance depends on image
              quality, lighting, skin tone, and model training data coverage.
            </p>
          </DisclaimerSection>

          <DisclaimerSection icon="recommend" title="3. Product Recommendations">
            <p>
              Skincare product suggestions generated by SkinSight are based on publicly available
              ingredient research and are provided for <strong>informational and educational purposes only</strong>.
              They do not constitute medical prescriptions.
            </p>
            <div className="mt-4 space-y-3">
              {[
                { icon: "warning", text: "Always perform a patch test before applying any new product to your face." },
                { icon: "allergy", text: "Inform a healthcare provider of all products you use, especially if taking medication." },
                { icon: "local_pharmacy", text: "Ingredients flagged in the system (e.g. retinol, AHAs) can cause irritation — introduce them gradually." },
                { icon: "pregnant_woman", text: "Pregnant or breastfeeding individuals should consult a doctor before using any active-ingredient products." },
              ].map(({ icon, text }) => (
                <div key={text} className="flex gap-3 text-sm bg-surface-container-low rounded-xl p-3">
                  <span className="material-symbols-outlined text-secondary text-base mt-0.5 shrink-0">{icon}</span>
                  <span className="text-on-surface-variant">{text}</span>
                </div>
              ))}
            </div>
          </DisclaimerSection>

          <DisclaimerSection icon="balance" title="4. No Liability">
            <p>
              To the maximum extent permitted by Malaysian law, SkinSight, its developer (Noraina
              Suria Amiera Norazman), and Management and Science University (MSU) accept{" "}
              <strong>no liability</strong> for:
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Any harm arising from reliance on AI-generated skin analysis results",
                "Adverse reactions to skincare products recommended by the system",
                "Delays in seeking appropriate professional medical care",
                "Inaccurate results caused by poor image quality or unusual lighting conditions",
                "Any psychological distress caused by condition severity scores",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline text-base mt-0.5 shrink-0">remove</span>
                  {item}
                </li>
              ))}
            </ul>
          </DisclaimerSection>

          <DisclaimerSection icon="school" title="5. Research Context">
            <p>
              SkinSight is a <strong>Bachelor of Computer Science (Honours) final year project</strong>{" "}
              at Management and Science University (MSU), Malaysia (2025). It is intended to demonstrate
              technical feasibility of AI-assisted skin screening for resource-constrained users, not to
              replace clinical pathways.
            </p>
            <p className="mt-3">
              The project has been reviewed by academic supervisors at MSU. It has not been reviewed by
              the Malaysian Medical Device Authority (MDA) or the Ministry of Health (KKM), as it does
              not meet the definition of a medical device under the Medical Device Act 2012.
            </p>
          </DisclaimerSection>

          <DisclaimerSection icon="thumb_up" title="6. Responsible Use">
            <p className="mb-3">By using SkinSight you agree to:</p>
            <ul className="space-y-2">
              {[
                "Use results as informational guidance only, not as a diagnosis",
                "Consult a qualified dermatologist for any persistent, worsening, or severe condition",
                "Not delay or avoid seeking professional help because of an AI result",
                "Use the referral flag (cystic acne, severe conditions) as an urgent prompt to see a doctor",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">check</span>
                  {item}
                </li>
              ))}
            </ul>
          </DisclaimerSection>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Contact Support
            </Link>
            <Link href="/privacy" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-outline-variant/30 text-primary rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
              Privacy Policy
            </Link>
          </div>

        </section>
      </main>
      <Footer />
    </>
  );
}

function DisclaimerSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
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
