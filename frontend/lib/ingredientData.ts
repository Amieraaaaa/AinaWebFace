// Ingredient metadata mirroring backend/services/ingredient_rules.py.
// Used by ProductDetailModal to show scoring breakdowns and incompatibility warnings.

export interface IncompatibleEntry {
  inci: string;
  displayName: string;
  reason: string;
}

export interface IngredientMeta {
  inci: string;
  displayName: string;
  role: string;
  strengthScore: number;         // 0–1 clinical strength (max across conditions)
  evidenceScore: number;         // 0–1 evidence quality
  skinTypeMatch: string[];       // oily | dry | combination | normal | sensitive
  fitzpatrickDemotion: number[]; // Fitzpatrick types where score is demoted
  conditions: string[];          // skin conditions this ingredient targets
  incompatibleWith: IncompatibleEntry[];
}

const DB: IngredientMeta[] = [
  {
    inci: "SALICYLIC_ACID",
    displayName: "Salicylic Acid (BHA)",
    role: "Oil-soluble beta-hydroxy acid that penetrates pores to dissolve sebum plugs, exfoliate inside follicles, and reduce inflammation — the gold standard for acne and congested skin.",
    strengthScore: 0.85,
    evidenceScore: 0.90,
    skinTypeMatch: ["oily", "combination"],
    fitzpatrickDemotion: [],
    conditions: ["acne", "oiliness", "texture"],
    incompatibleWith: [
      { inci: "RETINOL", displayName: "Retinol", reason: "Combined use can cause excessive dryness, barrier disruption, and irritation" },
    ],
  },
  {
    inci: "BENZOYL_PEROXIDE",
    displayName: "Benzoyl Peroxide",
    role: "Bactericidal agent that directly eliminates C. acnes bacteria in follicles. Most effective against inflammatory acne at 2.5–5%; higher concentrations add irritation without extra benefit.",
    strengthScore: 0.90,
    evidenceScore: 0.92,
    skinTypeMatch: ["oily", "combination"],
    fitzpatrickDemotion: [],
    conditions: ["acne"],
    incompatibleWith: [
      { inci: "RETINOL", displayName: "Retinol", reason: "Benzoyl peroxide oxidises and deactivates retinol, rendering it ineffective" },
      { inci: "VITAMIN_C", displayName: "Vitamin C", reason: "Benzoyl peroxide oxidises and degrades Vitamin C, significantly reducing efficacy" },
    ],
  },
  {
    inci: "NIACINAMIDE",
    displayName: "Niacinamide (Vitamin B3)",
    role: "Versatile water-soluble vitamin that reduces sebum secretion, calms inflammation, blocks melanin transfer to keratinocytes, and reinforces the skin barrier — suitable for almost all skin types.",
    strengthScore: 0.78,
    evidenceScore: 0.85,
    skinTypeMatch: ["oily", "dry", "combination", "normal", "sensitive"],
    fitzpatrickDemotion: [],
    conditions: ["acne", "oiliness", "pigmentation", "redness"],
    incompatibleWith: [
      { inci: "VITAMIN_C", displayName: "Vitamin C", reason: "Can form a yellow nicotinic acid complex that reduces both ingredients' efficacy; use at separate times of day" },
    ],
  },
  {
    inci: "AZELAIC_ACID",
    displayName: "Azelaic Acid",
    role: "Dicarboxylic acid with antibacterial, anti-inflammatory, and tyrosinase-inhibiting properties. Simultaneously targets acne, redness, and pigmentation — well-tolerated on sensitive skin.",
    strengthScore: 0.78,
    evidenceScore: 0.82,
    skinTypeMatch: ["oily", "combination", "sensitive"],
    fitzpatrickDemotion: [],
    conditions: ["acne", "pigmentation", "redness"],
    incompatibleWith: [],
  },
  {
    inci: "RETINOL",
    displayName: "Retinol (Vitamin A)",
    role: "Gold-standard retinoid that accelerates cell turnover, promotes collagen synthesis, normalises sebaceous gland activity, and reduces comedone formation. Begin at 0.025–0.05% and build gradually.",
    strengthScore: 0.88,
    evidenceScore: 0.90,
    skinTypeMatch: ["oily", "combination", "normal"],
    fitzpatrickDemotion: [4, 5, 6],
    conditions: ["acne", "texture"],
    incompatibleWith: [
      { inci: "GLYCOLIC_ACID", displayName: "Glycolic Acid", reason: "Combined use can over-exfoliate and severely damage the skin barrier" },
      { inci: "LACTIC_ACID", displayName: "Lactic Acid", reason: "Combined use can over-exfoliate and severely damage the skin barrier" },
      { inci: "SALICYLIC_ACID", displayName: "Salicylic Acid", reason: "Combined use can cause excessive dryness, barrier disruption, and irritation" },
      { inci: "BENZOYL_PEROXIDE", displayName: "Benzoyl Peroxide", reason: "Benzoyl peroxide oxidises and deactivates retinol, rendering it ineffective" },
    ],
  },
  {
    inci: "HYALURONIC_ACID",
    displayName: "Hyaluronic Acid (HA)",
    role: "High-molecular-weight humectant that can hold up to 1000× its weight in water. Apply to damp skin and seal with moisturiser for best effect; especially effective in humid outdoor conditions.",
    strengthScore: 0.80,
    evidenceScore: 0.88,
    skinTypeMatch: ["dry", "combination", "normal", "sensitive"],
    fitzpatrickDemotion: [],
    conditions: ["dryness"],
    incompatibleWith: [],
  },
  {
    inci: "CERAMIDE_NP",
    displayName: "Ceramides",
    role: "Lipid molecules that form the intercellular 'mortar' of the skin barrier. Ceramide NP (type 3) directly replenishes the barrier's depleted lipid matrix — essential for long-term dryness and sensitivity repair.",
    strengthScore: 0.85,
    evidenceScore: 0.90,
    skinTypeMatch: ["dry", "sensitive"],
    fitzpatrickDemotion: [],
    conditions: ["dryness", "sensitivity"],
    incompatibleWith: [],
  },
  {
    inci: "GLYCERIN",
    displayName: "Glycerin",
    role: "Small, highly effective humectant that draws moisture from the environment into the skin. Affordable, well-studied, and widely available in Malaysian drugstore moisturisers.",
    strengthScore: 0.75,
    evidenceScore: 0.85,
    skinTypeMatch: ["dry", "combination", "normal", "sensitive"],
    fitzpatrickDemotion: [],
    conditions: ["dryness"],
    incompatibleWith: [],
  },
  {
    inci: "SQUALANE",
    displayName: "Squalane",
    role: "Lightweight emollient that mimics skin's natural sebum. Non-comedogenic, non-greasy, and ideal for Malaysia's heat — provides occlusion and moisture-sealing without heaviness.",
    strengthScore: 0.78,
    evidenceScore: 0.82,
    skinTypeMatch: ["dry", "normal"],
    fitzpatrickDemotion: [],
    conditions: ["dryness"],
    incompatibleWith: [],
  },
  {
    inci: "ZINC_PCA",
    displayName: "Zinc PCA",
    role: "Sebum-regulating and mild antibacterial agent. Clinically shown to reduce sebum excretion and pore visibility; commonly found in physical SPFs as Zinc Oxide.",
    strengthScore: 0.70,
    evidenceScore: 0.78,
    skinTypeMatch: ["oily", "combination"],
    fitzpatrickDemotion: [],
    conditions: ["oiliness"],
    incompatibleWith: [],
  },
  {
    inci: "VITAMIN_C",
    displayName: "Vitamin C (L-Ascorbic Acid)",
    role: "Potent antioxidant that inhibits tyrosinase to block melanin synthesis, brightens uneven skin tone, and provides UV photoprotection. Most effective freshly formulated at pH < 3.5.",
    strengthScore: 0.82,
    evidenceScore: 0.88,
    skinTypeMatch: ["dry", "combination", "normal"],
    fitzpatrickDemotion: [],
    conditions: ["pigmentation"],
    incompatibleWith: [
      { inci: "GLYCOLIC_ACID", displayName: "Glycolic Acid", reason: "Low pH of AHA destabilises Vitamin C's structure, reducing brightening efficacy" },
      { inci: "NIACINAMIDE", displayName: "Niacinamide", reason: "Can form a yellow pigment complex that reduces both ingredients' efficacy" },
      { inci: "BENZOYL_PEROXIDE", displayName: "Benzoyl Peroxide", reason: "Benzoyl peroxide oxidises and degrades Vitamin C, significantly reducing efficacy" },
    ],
  },
  {
    inci: "ALPHA_ARBUTIN",
    displayName: "Alpha Arbutin",
    role: "Gentler hydroquinone precursor that inhibits tyrosinase at low concentrations. Suitable for daily use on Fitzpatrick types III–VI common in Malaysia; minimal irritation risk.",
    strengthScore: 0.70,
    evidenceScore: 0.78,
    skinTypeMatch: ["dry", "combination", "normal"],
    fitzpatrickDemotion: [],
    conditions: ["pigmentation"],
    incompatibleWith: [],
  },
  {
    inci: "GLYCOLIC_ACID",
    displayName: "Glycolic Acid (AHA)",
    role: "Smallest alpha-hydroxy acid with the deepest penetration. Exfoliates surface dead cells, resurfaces rough texture, and brightens uneven pigmentation. Use 1–2× weekly; always follow with SPF.",
    strengthScore: 0.82,
    evidenceScore: 0.87,
    skinTypeMatch: ["oily", "combination"],
    fitzpatrickDemotion: [4, 5, 6],
    conditions: ["pigmentation", "texture"],
    incompatibleWith: [
      { inci: "RETINOL", displayName: "Retinol", reason: "Combined use can over-exfoliate and severely damage the skin barrier" },
      { inci: "VITAMIN_C", displayName: "Vitamin C", reason: "Low pH of AHA destabilises Vitamin C structure, reducing brightening efficacy" },
    ],
  },
  {
    inci: "LACTIC_ACID",
    displayName: "Lactic Acid (AHA)",
    role: "Gentler alpha-hydroxy acid with additional hydrating properties. A better starting point than glycolic acid for beginners; improves surface texture while maintaining barrier moisture.",
    strengthScore: 0.75,
    evidenceScore: 0.82,
    skinTypeMatch: ["dry", "combination", "sensitive"],
    fitzpatrickDemotion: [5, 6],
    conditions: ["texture"],
    incompatibleWith: [
      { inci: "RETINOL", displayName: "Retinol", reason: "Combined use can over-exfoliate and severely damage the skin barrier" },
    ],
  },
  {
    inci: "POLYHYDROXY_ACID",
    displayName: "Polyhydroxy Acid (PHA)",
    role: "Gentlest exfoliant class with humectant properties. Larger molecules mean slower penetration and less irritation; suitable for sensitive or reactive skin that cannot tolerate standard AHAs.",
    strengthScore: 0.65,
    evidenceScore: 0.75,
    skinTypeMatch: ["sensitive", "dry"],
    fitzpatrickDemotion: [],
    conditions: ["texture"],
    incompatibleWith: [],
  },
  {
    inci: "CENTELLA_ASIATICA",
    displayName: "Centella Asiatica (Cica)",
    role: "Botanical extract with proven anti-inflammatory and wound-healing activity. Promotes barrier repair and collagen synthesis; widely present in Korean and Malaysian skincare brands for sensitive and reactive skin.",
    strengthScore: 0.72,
    evidenceScore: 0.80,
    skinTypeMatch: ["sensitive", "dry", "combination"],
    fitzpatrickDemotion: [],
    conditions: ["sensitivity", "redness"],
    incompatibleWith: [],
  },
  {
    inci: "PANTHENOL",
    displayName: "Panthenol (Pro-Vitamin B5)",
    role: "Humectant and anti-inflammatory provitamin that aids barrier repair and soothing. Converts to pantothenic acid in the skin, supporting cell regeneration without irritation.",
    strengthScore: 0.70,
    evidenceScore: 0.78,
    skinTypeMatch: ["sensitive", "dry"],
    fitzpatrickDemotion: [],
    conditions: ["sensitivity"],
    incompatibleWith: [],
  },
  {
    inci: "ALLANTOIN",
    displayName: "Allantoin",
    role: "Keratolytic at low concentrations with strong soothing and wound-healing properties. Reduces the burning and stinging associated with reactive skin while promoting healthy cell renewal.",
    strengthScore: 0.68,
    evidenceScore: 0.75,
    skinTypeMatch: ["sensitive", "dry", "combination"],
    fitzpatrickDemotion: [],
    conditions: ["sensitivity", "redness"],
    incompatibleWith: [],
  },
  {
    inci: "GREEN_TEA_EXTRACT",
    displayName: "Green Tea Extract (EGCG)",
    role: "Polyphenol-rich antioxidant with potent anti-inflammatory activity. EGCG (epigallocatechin gallate) reduces UV-induced inflammation and persistent redness, supporting vascular stability in reactive skin.",
    strengthScore: 0.65,
    evidenceScore: 0.72,
    skinTypeMatch: ["sensitive", "dry", "combination"],
    fitzpatrickDemotion: [],
    conditions: ["redness"],
    incompatibleWith: [],
  },
];

// Case-insensitive substring aliases → INCI name.
// Longer/more-specific aliases must come first to avoid false matches.
const ALIASES: [string, string][] = [
  ["salicylic acid", "SALICYLIC_ACID"],
  ["benzoyl peroxide", "BENZOYL_PEROXIDE"],
  ["hyaluronic acid", "HYALURONIC_ACID"],
  ["l-ascorbic acid", "VITAMIN_C"],
  ["ascorbic acid", "VITAMIN_C"],
  ["vitamin c", "VITAMIN_C"],
  ["alpha arbutin", "ALPHA_ARBUTIN"],
  ["glycolic acid", "GLYCOLIC_ACID"],
  ["lactic acid", "LACTIC_ACID"],
  ["polyhydroxy acid", "POLYHYDROXY_ACID"],
  ["azelaic acid", "AZELAIC_ACID"],
  ["centella asiatica", "CENTELLA_ASIATICA"],
  ["green tea extract", "GREEN_TEA_EXTRACT"],
  ["green tea", "GREEN_TEA_EXTRACT"],
  ["niacinamide", "NIACINAMIDE"],
  ["vitamin b3", "NIACINAMIDE"],
  ["retinol", "RETINOL"],
  ["retinoid", "RETINOL"],
  ["adapalene", "RETINOL"],
  ["ceramide", "CERAMIDE_NP"],
  ["glycerin", "GLYCERIN"],
  ["glycerol", "GLYCERIN"],
  ["squalane", "SQUALANE"],
  ["zinc pca", "ZINC_PCA"],
  ["zinc oxide", "ZINC_PCA"],
  ["arbutin", "ALPHA_ARBUTIN"],
  ["panthenol", "PANTHENOL"],
  ["allantoin", "ALLANTOIN"],
  ["centella", "CENTELLA_ASIATICA"],
  ["cica", "CENTELLA_ASIATICA"],
  ["egcg", "GREEN_TEA_EXTRACT"],
  ["bha", "SALICYLIC_ACID"],
  ["aha", "GLYCOLIC_ACID"],
  ["pha", "POLYHYDROXY_ACID"],
  ["ha", "HYALURONIC_ACID"],
];

const DB_MAP = new Map(DB.map(m => [m.inci, m]));

export function lookupIngredient(keyIngredient: string): IngredientMeta | null {
  const trimmed = keyIngredient.trim();

  // 1. Exact INCI match (e.g. "SALICYLIC_ACID")
  if (DB_MAP.has(trimmed.toUpperCase())) return DB_MAP.get(trimmed.toUpperCase())!;

  // 2. Normalised INCI match (spaces → underscores)
  const normalised = trimmed.toUpperCase().replace(/\s+/g, "_");
  if (DB_MAP.has(normalised)) return DB_MAP.get(normalised)!;

  // 3. Alias substring match
  const lower = trimmed.toLowerCase();
  for (const [alias, inci] of ALIASES) {
    if (lower.includes(alias)) return DB_MAP.get(inci) ?? null;
  }

  return null;
}
