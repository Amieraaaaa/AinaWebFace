"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSession } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user } = useSession();
  const [skinType, setSkinType] = useState("oily");
  const [fitzpatrick, setFitzpatrick] = useState("3");
  const [halal, setHalal] = useState(true);
  const [budget, setBudget] = useState("budget");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const supabase = createClient();

  // Load profile from Supabase + local preferences on mount
  useEffect(() => {
    if (!user) return;

    // Load halal/budget from localStorage (not yet in DB schema)
    setHalal(localStorage.getItem("skinsight_halal") !== "false");
    setBudget(localStorage.getItem("skinsight_budget") ?? "budget");

    // Load DB-persisted fields
    supabase
      .from("profiles")
      .select("known_skin_type, fitzpatrick_scale, known_allergies, full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.known_skin_type && data.known_skin_type !== "unknown") {
          setSkinType(data.known_skin_type);
        }
        if (data.fitzpatrick_scale) {
          setFitzpatrick(String(data.fitzpatrick_scale));
        }
        if (Array.isArray(data.known_allergies) && data.known_allergies.length > 0) {
          setAllergies(data.known_allergies.join(", "));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveStatus("idle");

    // Persist halal/budget to localStorage
    localStorage.setItem("skinsight_halal", String(halal));
    localStorage.setItem("skinsight_budget", budget);

    // Persist skin profile to Supabase
    const allergyList = allergies
      .split(",")
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean);

    const { error } = await supabase
      .from("profiles")
      .update({
        known_skin_type: skinType,
        fitzpatrick_scale: parseInt(fitzpatrick),
        known_allergies: allergyList,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "Student";
  const displayEmail = user?.email ?? "";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-MY", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-3xl mx-auto">

        <div className="mb-10">
          <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-fixed rounded-full font-label uppercase">
            My Profile
          </span>
          <h1 className="font-headline text-4xl font-extrabold text-on-background tracking-tight">
            Skin Profile
          </h1>
          <p className="text-on-surface-variant mt-2">
            Your preferences improve recommendation accuracy.
          </p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-6 mb-10 p-6 bg-surface-container-lowest rounded-3xl shadow-sm">
          <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">account_circle</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">{displayName}</h2>
            <p className="text-on-surface-variant text-sm">{displayEmail}</p>
            <p className="text-xs text-on-surface-variant mt-1">Member since {memberSince}</p>
          </div>
        </div>

        {/* Save status banner */}
        {saveStatus === "saved" && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
            <p className="text-green-800 text-sm font-medium">Profile saved successfully.</p>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-error-container rounded-xl">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <p className="text-on-error-container text-sm font-medium">Failed to save profile. Please try again.</p>
          </div>
        )}

        {/* Profile form */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm space-y-8">

          {/* Skin type */}
          <div>
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Skin Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {["oily", "dry", "combination", "normal", "sensitive"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSkinType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all ${
                    skinType === type
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Fitzpatrick */}
          <div>
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Fitzpatrick Scale (Skin Tone)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {["1", "2", "3", "4", "5", "6"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFitzpatrick(f)}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${
                    fitzpatrick === f
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant mt-2">1 = Very fair · 6 = Very dark</p>
          </div>

          {/* Budget */}
          <div>
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Budget Preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "budget", label: "Budget", sub: "Under RM30" },
                { value: "mid", label: "Mid-range", sub: "RM30–RM80" },
                { value: "premium", label: "Premium", sub: "RM80+" },
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBudget(b.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all text-left ${
                    budget === b.value
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="block">{b.label}</span>
                  <span className={`text-xs font-normal ${budget === b.value ? "text-primary-fixed" : "text-on-surface-variant"}`}>
                    {b.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Halal */}
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
            <div>
              <p className="font-headline font-bold text-on-surface">Halal Certified Only</p>
              <p className="text-sm text-on-surface-variant">Only show halal-certified products</p>
            </div>
            <button
              onClick={() => setHalal(!halal)}
              className={`relative w-14 h-7 rounded-full transition-colors ${halal ? "bg-primary" : "bg-outline"}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${halal ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Allergies */}
          <div>
            <label className="block font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Known Allergies / Ingredients to Avoid
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. FRAGRANCE, ALCOHOL, RETINOL"
              className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-surface-tint/40 outline-none"
            />
            <p className="text-xs text-on-surface-variant mt-2">Separate multiple ingredients with commas</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full cta-gradient text-white font-headline font-bold py-3.5 rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>

      </main>
      <Footer />
    </>
  );
}
