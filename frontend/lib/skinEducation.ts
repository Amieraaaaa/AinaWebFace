import type { ConditionType } from "@/types/analysis";

export interface IngredientInfo {
  name: string;
  role: string;
}

export interface ConditionArticle {
  icon: string;
  colorKey: string;
  tagline: string;
  what: string;
  whyMalaysia: string;
  tips: string[];
  ingredients: IngredientInfo[];
}

export const CONDITION_ARTICLES: Record<ConditionType, ConditionArticle> = {
  acne: {
    icon: "healing",
    colorKey: "purple",
    tagline: "Blocked pores, bacteria, and skin inflammation",
    what:
      "Acne develops when hair follicles become plugged with excess sebum and dead skin cells, creating an environment where Cutibacterium acnes bacteria thrive. This triggers inflammation that appears as whiteheads, blackheads, papules, pustules, or deeper cysts. It is one of the most prevalent skin conditions globally, affecting up to 85% of people aged 12–25.",
    whyMalaysia:
      "Malaysia's tropical climate — with temperatures averaging 27–32 °C and relative humidity above 80% — promotes sweating that mixes with sebum to accelerate pore blockage. Academic stress at universities elevates cortisol, directly stimulating sebaceous glands. Dietary patterns common among Malaysian students (high-glycaemic index foods such as white rice, roti canai, sweetened beverages, and spicy dishes) have been associated with greater acne severity in clinical studies.",
    tips: [
      "Cleanse twice daily with a gentle, pH-balanced cleanser (pH 4.5–5.5) to remove sweat and excess oil without stripping the barrier.",
      "Double-cleanse after outdoor activity or sunscreen use: oil-based cleanser first, then water-based.",
      "Avoid touching your face; launder pillowcases at least once a week to reduce bacterial transfer.",
      "Introduce active ingredients (BHA, benzoyl peroxide) slowly — apply every other night initially to minimise irritation.",
      "Acne-prone skin still needs moisturiser; choose gel-textured, non-comedogenic, oil-free formulas.",
      "Never pick or squeeze blemishes — this prolongs healing and significantly increases the risk of post-inflammatory hyperpigmentation (PIH), especially on South-East Asian skin tones.",
    ],
    ingredients: [
      { name: "Salicylic Acid (BHA, 0.5–2%)", role: "Oil-soluble exfoliant that penetrates pores to dissolve sebum plugs and reduce inflammation." },
      { name: "Benzoyl Peroxide (2.5–5%)", role: "Directly kills C. acnes bacteria. Start at 2.5% to minimise bleaching and irritation." },
      { name: "Niacinamide (4–10%)", role: "Reduces sebum secretion rate, calms redness, and fades post-acne marks over time." },
      { name: "Adapalene (Retinoid, 0.1%)", role: "Normalises cell turnover and reduces comedone formation. Begin 2–3 nights per week." },
      { name: "Azelaic Acid (10–20%)", role: "Antibacterial, anti-inflammatory, and brightening — targets acne and PIH simultaneously." },
    ],
  },

  dryness: {
    icon: "dry",
    colorKey: "blue",
    tagline: "Impaired barrier and insufficient skin hydration",
    what:
      "Dry skin occurs when the stratum corneum (skin's outermost layer) loses water faster than it can retain it, resulting in tightness, flaking, rough texture, and in severe cases, cracking or fissuring. Clinically, dryness is a barrier dysfunction condition distinct from dehydration: dry skin lacks lipids, while dehydrated skin lacks water — though both can occur together.",
    whyMalaysia:
      "Paradoxically, Malaysia's outdoor humidity does not protect against skin dryness. Prolonged exposure to air-conditioned environments in university lecture halls, libraries, malls, and offices dramatically lowers ambient humidity indoors, accelerating transepidermal water loss (TEWL). Over-cleansing with harsh surfactants, showering with hot water, and the popularity of alcohol-heavy toners further strip the skin's protective lipid barrier.",
    tips: [
      "Apply moisturiser within 60 seconds of washing while skin is still slightly damp — this traps residual water effectively.",
      "Layer hydration in order: humectant serum (glycerin or hyaluronic acid) first, then a lipid-rich moisturiser to seal it in.",
      "Avoid cleansers with sodium lauryl sulphate (SLS) — opt for cream-to-milk or gentle gel formulas instead.",
      "Use lukewarm (not hot) water for cleansing; hot water dissolves the skin's protective lipid layer.",
      "Drink at least 8 glasses of water daily — heat and outdoor activity increase insensible water loss.",
      "If sleeping in air-conditioned rooms, use a humidifier or place a bowl of water nearby to compensate for indoor dryness.",
    ],
    ingredients: [
      { name: "Hyaluronic Acid (HA)", role: "Humectant that draws moisture into skin. Apply to damp skin for best effect in humid outdoor air." },
      { name: "Glycerin", role: "Highly effective, affordable humectant. Readily available in most Malaysian drugstore moisturisers." },
      { name: "Ceramides (NP, AP, EOP)", role: "Replenish the intercellular lipid matrix — critical for long-term barrier repair." },
      { name: "Squalane", role: "Lightweight emollient that mimics skin sebum; non-comedogenic and ideal for Malaysia's heat." },
      { name: "Centella Asiatica", role: "Anti-inflammatory; supports barrier repair and is widely present in local Malaysian skincare brands." },
    ],
  },

  oiliness: {
    icon: "water_drop",
    colorKey: "cyan",
    tagline: "Excess sebum from overactive sebaceous glands",
    what:
      "Oily skin results from sebaceous glands producing more sebum than is needed for normal barrier function. While sebum plays an essential protective role, excess oil creates a visible shine, makes pores appear enlarged, and fosters a microenvironment that can trap bacteria and dead cells — increasing the likelihood of acne and congestion.",
    whyMalaysia:
      "The equatorial climate directly stimulates sebaceous glands: heat activates both sweat glands and sebocytes simultaneously, and high ambient temperature accelerates sebum flow to the skin surface. Many students worsen oiliness unintentionally through over-cleansing — stripping oil signals the skin to compensate by producing even more sebum, a phenomenon known as sebum rebound.",
    tips: [
      "Cleanse with a gentle, pH-balanced cleanser twice daily maximum — over-washing triggers rebound sebum overproduction.",
      "Never skip moisturiser; choose a lightweight, oil-free gel moisturiser. Skipping it causes greater oiliness, not less.",
      "Blotting papers are the best midday fix — they absorb excess sebum without disrupting SPF or makeup.",
      "Clay masks (kaolin or bentonite) used 1–2 times per week absorb excess sebum without stripping the barrier.",
      "Check product labels: look for 'oil-free', 'non-comedogenic', and 'water-based' formulations.",
      "Niacinamide shows measurable reduction in sebum excretion rate with consistent use over 8–12 weeks.",
    ],
    ingredients: [
      { name: "Niacinamide (4–10%)", role: "Clinically shown to reduce sebum excretion rate; also reduces pore visibility." },
      { name: "Salicylic Acid (BHA, 0.5–2%)", role: "Oil-soluble; dissolves excess sebum inside pores and prevents congestion." },
      { name: "Zinc PCA or Zinc Oxide", role: "Regulates sebum production and has mild antibacterial properties; found in many SPFs." },
      { name: "Kaolin / Bentonite Clay", role: "Absorbs surface sebum in masks; use once or twice weekly to avoid over-drying." },
      { name: "Retinol / Retinoids", role: "Long-term normalisers of sebaceous gland activity. Begin low-dose and build gradually." },
    ],
  },

  pigmentation: {
    icon: "tonality",
    colorKey: "orange",
    tagline: "Uneven melanin distribution and dark spots",
    what:
      "Hyperpigmentation occurs when melanocytes produce excess melanin in localised areas, creating dark patches. The main types include post-inflammatory hyperpigmentation (PIH) triggered by acne or injury, melasma caused by hormonal changes and UV exposure, and solar lentigines (sun spots) from cumulative UV damage. PIH is particularly persistent and noticeable on medium-to-dark skin tones.",
    whyMalaysia:
      "Malaysia receives a UV index of 8–11 (Very High to Extreme) year-round — one of the highest globally. UV radiation is the most potent trigger for melanin overproduction. For students of Malay, Chinese, and Indian heritage — who frequently have Fitzpatrick skin types III–VI — PIH from acne marks is especially prominent and slow to fade, as melanin-rich skin produces more post-inflammatory pigment when injured.",
    tips: [
      "Broad-spectrum SPF 30+ (SPF 50 recommended) is the single most effective pigmentation intervention — no brightening serum compensates for unprotected UV exposure.",
      "Reapply sunscreen every 2 hours when outdoors; avoid peak UV hours between 10 am and 4 pm.",
      "Never pick at pimples or blemishes — this is the primary cause of PIH in university-aged students.",
      "Apply Vitamin C serum in the morning before SPF; store in a cool, dark location to prevent oxidation.",
      "Pigmentation responds slowly — expect 8–12 weeks of consistent use before visible brightening.",
      "For significant melasma, consult a dermatologist. Prescription tranexamic acid or hydroquinone may be required.",
    ],
    ingredients: [
      { name: "L-Ascorbic Acid (Vitamin C, 10–20%)", role: "Inhibits tyrosinase enzyme, blocking melanin synthesis. Most effective when fresh and stabilised." },
      { name: "Niacinamide (5–10%)", role: "Blocks melanin transfer from melanocytes to keratinocytes; well-tolerated on all skin tones." },
      { name: "Tranexamic Acid (2–5%)", role: "Highly effective for melasma and PIH; well-suited for darker skin tones common in Malaysia." },
      { name: "Azelaic Acid (10–20%)", role: "Selectively targets overactive melanocytes while also reducing inflammation." },
      { name: "Alpha Arbutin (1–2%)", role: "A gentler hydroquinone precursor; suitable for daily use on darker Fitzpatrick skin types." },
    ],
  },

  texture: {
    icon: "texture",
    colorKey: "amber",
    tagline: "Rough, uneven skin surface and enlarged pores",
    what:
      "Textural irregularities include rough patches, bumpy skin (milia, closed comedones, sebaceous filaments), visibly enlarged pores, and an uneven, dull surface. These result from accumulated dead skin cells, pore congestion, photodamage, and slowed cell turnover. Texture concerns are distinct from active acne, though they frequently co-exist.",
    whyMalaysia:
      "Malaysia's high year-round UV index accelerates photoageing — thickening the stratum corneum and degrading collagen — which progressively roughens skin texture. Sweat and sebum accumulation in pores, particularly during outdoor activities, combined with inadequate or irregular exfoliation, creates congestion. Heavy occlusive sunscreens and cream formulas, while protective, may also contribute to textural congestion in humid conditions.",
    tips: [
      "Use chemical exfoliants (AHAs or BHA) 1–2 times per week; daily exfoliation is rarely beneficial and risks irritation.",
      "Always apply SPF after AHA use — glycolic and lactic acids increase photosensitivity, making sun protection non-negotiable.",
      "Retinoids (vitamin A) are the most evidence-backed tool for long-term improvement of texture and cell turnover.",
      "Keep skin well-hydrated — dehydration makes surface irregularities appear more pronounced.",
      "Enzyme masks (papaya, pineapple bromelain) offer gentle exfoliation suitable for sensitive or reactive skin.",
      "Avoid abrasive physical scrubs on inflamed skin — they cause micro-tears and worsen irritation.",
    ],
    ingredients: [
      { name: "Glycolic Acid (AHA, 5–10%)", role: "Smallest AHA; deepest penetration and most dramatic surface resurfacing for texture." },
      { name: "Lactic Acid (AHA, 5–10%)", role: "Gentler AHA with additional hydrating properties; a good starting point for beginners." },
      { name: "Salicylic Acid (BHA, 1–2%)", role: "Exfoliates inside pores; reduces congestion that causes bumpy texture and uneven surface." },
      { name: "Retinol / Adapalene", role: "Accelerates cell turnover and promotes collagen synthesis; most evidence-backed for long-term texture improvement." },
      { name: "Polyhydroxy Acids (PHAs)", role: "Gentlest exfoliant class; humectant properties make them suitable for sensitive or reactive skin." },
    ],
  },

  sensitivity: {
    icon: "sentiment_neutral",
    colorKey: "rose",
    tagline: "Heightened reactivity and barrier dysfunction",
    what:
      "Sensitive skin is characterised by a compromised barrier that allows irritants, allergens, and microbes to penetrate more easily, triggering reactive responses such as burning, stinging, itching, or flushing. It is a functional skin characteristic — not a single diagnosis — and can manifest as a chronic trait or a temporary state brought on by overuse of active ingredients.",
    whyMalaysia:
      "Daily heat and UV stress impair the skin barrier in Malaysia. Over-exfoliation — a frequent mistake driven by social media 'glass skin' trends — compromises ceramide content and leaves skin persistently reactive. Highly fragranced local products and essential-oil-heavy formulas are common culprits. Sweat disrupts the skin's acid mantle (optimal pH 4.5–5.5), increasing permeability to irritants.",
    tips: [
      "Adopt a minimal, fragrance-free skincare routine — fewer ingredients make it easier to identify triggers.",
      "Patch test every new product on the inner forearm for 48–72 hours before applying to the face.",
      "Prioritise barrier-repairing ingredients: ceramides, squalane, centella asiatica, and panthenol.",
      "Use thermal water sprays (e.g. Avène, La Roche-Posay) to soothe heat-triggered flare-ups throughout the day.",
      "Cleanse with cool or lukewarm water — heat and steam can initiate reactive episodes.",
      "If persistent stinging or burning occurs, discontinue all active ingredients for 2–4 weeks and focus solely on barrier restoration.",
    ],
    ingredients: [
      { name: "Ceramides (NP, AP, EOP)", role: "Directly replenish the compromised lipid barrier — the cornerstone of sensitive skin care." },
      { name: "Centella Asiatica (Cica)", role: "Proven anti-inflammatory and wound-healing activity; central ingredient in many Korean and Malaysian brands." },
      { name: "Beta-Glucan", role: "Deeply soothing and anti-inflammatory; promotes barrier repair and reduces reactive redness." },
      { name: "Panthenol (Pro-Vitamin B5)", role: "Humectant and anti-inflammatory; aids barrier repair and skin soothing without irritation." },
      { name: "Allantoin", role: "Keratolytic at low concentrations; highly soothing and promotes healing in reactive skin." },
    ],
  },

  redness: {
    icon: "favorite",
    colorKey: "red",
    tagline: "Persistent flushing and visible inflammation",
    what:
      "Facial redness spans a spectrum from temporary flushing to persistent erythema from dilated capillaries, contact dermatitis, or rosacea. Rosacea is a chronic inflammatory condition characterised by central facial redness, visible telangiectasia (broken capillaries), and frequently co-existing sensitivity. Any persistent, unexplained, or worsening redness warrants professional evaluation to rule out rosacea or contact allergy.",
    whyMalaysia:
      "Malaysia's heat is among the most potent triggers for facial flushing and rosacea flare-ups. Spicy foods — a staple of Malaysian cuisine including cili padi, curry, and sambal — cause systemic vasodilation that manifests as increased facial redness. The country's year-round high UV index contributes to chronic vascular damage and persistent erythema. Managing redness is particularly challenging in a tropical climate where thermal triggers are unavoidable.",
    tips: [
      "Identify and consistently avoid personal triggers: common ones include spicy food, alcohol, hot beverages, sun exposure, and strenuous exercise in outdoor heat.",
      "Use gentle, fragrance-free, pH-balanced cleansers; pat (never rub) skin dry with a clean cloth.",
      "Broad-spectrum SPF 50 is essential — UV is both a direct trigger and a long-term cause of vascular damage and persistent redness.",
      "Azelaic acid is the most evidence-backed topical ingredient specifically validated for rosacea-associated redness.",
      "Facial cooling mists provide fast relief from thermally-triggered flushing in Malaysia's climate.",
      "Green-tinted colour-correctors or primers can neutralise redness for cosmetic coverage without aggravating reactive skin.",
    ],
    ingredients: [
      { name: "Azelaic Acid (10–20%)", role: "First-line evidence-based topical for rosacea-associated redness; anti-inflammatory and vascular." },
      { name: "Niacinamide (4–6%)", role: "Reduces redness and blotchiness; supports barrier integrity to reduce reactive episodes." },
      { name: "Centella Asiatica", role: "Calms inflammation and strengthens the barrier to reduce thermally-triggered reactive redness." },
      { name: "Allantoin", role: "Soothes and promotes healing; reduces the burn and sting associated with reactive redness." },
      { name: "Green Tea Extract (EGCG)", role: "Potent antioxidant with anti-inflammatory properties; reduces UV-induced redness and inflammation." },
    ],
  },
};

export const COLOR_MAP: Record<string, {
  bg: string; text: string; border: string; iconBg: string; tag: string;
}> = {
  purple: { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  iconBg: "bg-purple-100",  tag: "bg-purple-100 text-purple-800" },
  blue:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    iconBg: "bg-blue-100",    tag: "bg-blue-100 text-blue-800"   },
  cyan:   { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200",    iconBg: "bg-cyan-100",    tag: "bg-cyan-100 text-cyan-800"   },
  orange: { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  iconBg: "bg-orange-100",  tag: "bg-orange-100 text-orange-800" },
  amber:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   iconBg: "bg-amber-100",   tag: "bg-amber-100 text-amber-800"  },
  rose:   { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    iconBg: "bg-rose-100",    tag: "bg-rose-100 text-rose-800"   },
  red:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     iconBg: "bg-red-100",     tag: "bg-red-100 text-red-800"     },
};

export const GENERAL_MY_TIPS = [
  {
    icon: "wb_sunny",
    title: "SPF is non-negotiable",
    body: "Malaysia's UV index of 8–11 (Very High to Extreme) persists year-round. Apply broad-spectrum SPF 30–50 every morning as the last step of your routine, and reapply every 2 hours outdoors. No brightening ingredient compensates for unprotected UV exposure.",
  },
  {
    icon: "air",
    title: "Balance indoor and outdoor humidity",
    body: "Outdoor humidity (80–90%) is high, but indoor air-conditioning can drop humidity below 40%, causing dehydration. Use a lightweight humectant serum (glycerin or hyaluronic acid) daily and consider a desk humidifier in your room.",
  },
  {
    icon: "soap",
    title: "Double-cleanse after outdoor activity",
    body: "Sweat, sebum, sunscreen, and pollutants accumulate quickly in Malaysia's heat. Use an oil-based cleanser to dissolve sunscreen and sebum, followed by a gentle water-based cleanser — especially after lectures, commuting, or sports.",
  },
  {
    icon: "local_drink",
    title: "Hydration from within",
    body: "Heat and humidity increase insensible water loss through sweating. Aim for at least 8 glasses of water daily. Limit sweetened teh tarik and fruit juices — high sugar intake is linked to acne severity and accelerated skin ageing.",
  },
  {
    icon: "layers",
    title: "Choose lightweight formulas",
    body: "In Malaysia's heat and humidity, heavy creams and occlusive moisturisers can feel suffocating and increase congestion. Opt for gel moisturisers, water-gel hybrids, and fluid sunscreens. 'Rich' textures are best reserved for air-conditioned environments.",
  },
  {
    icon: "restaurant",
    title: "Mind your diet",
    body: "Malaysian cuisine is diverse and delicious, but frequent consumption of high-glycaemic index foods (white rice, bread, sugary drinks) and spicy dishes has been associated with increased acne severity and facial redness. Balance with fibre-rich vegetables and lower-GI carbohydrates.",
  },
];
