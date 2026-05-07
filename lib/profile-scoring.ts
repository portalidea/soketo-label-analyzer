import type {
  GlutenStatus,
  GlutenStatusValue,
  NutritionValues,
  ProfileScore,
  ProfilesAssessment,
  SoketoCategory,
} from "./types";

export function computeNetCarbs(v: NutritionValues): number {
  const carbs = Number(v.carbs) || 0;
  const fiber = Number(v.fiber) || 0;
  return Math.max(0, +(carbs - fiber).toFixed(1));
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function assessKeto(v: NutritionValues): ProfileScore {
  const netCarbs = computeNetCarbs(v);
  const sugars = Number(v.sugars) || 0;
  const protein = Number(v.protein) || 0;
  const fiber = Number(v.fiber) || 0;
  const fat = Number(v.fat) || 0;

  let score = 100;
  if (netCarbs > 5) score -= (netCarbs - 5) * 4;
  if (sugars > 5) score -= (sugars - 5) * 5;
  if (protein > 15) score += 5;
  if (fiber > 5) score += 3;
  if (fat > 15) score += 2;
  score = clamp(score);

  const label =
    score >= 90 ? "Keto Friendly"
    : score >= 70 ? "Keto OK"
    : score >= 45 ? "Con Moderazione"
    : "Non Keto";

  const reason =
    score >= 70
      ? `Profilo keto favorevole: ${netCarbs}g carb netti per 100g.`
      : score >= 45
        ? `Carb netti moderati (${netCarbs}g per 100g): consumare in piccole porzioni.`
        : `Troppi carb netti (${netCarbs}g per 100g) per la dieta chetogenica.`;

  return { score, label, reason };
}

export function assessLowCarb(v: NutritionValues): ProfileScore {
  const netCarbs = computeNetCarbs(v);
  const sugars = Number(v.sugars) || 0;

  let score = 100;
  if (netCarbs > 10) score -= (netCarbs - 10) * 3;
  if (sugars > 10) score -= (sugars - 10) * 2;
  score = clamp(score);

  const label =
    score >= 90 ? "Low-Carb Ottimo"
    : score >= 70 ? "Low-Carb OK"
    : score >= 45 ? "Carb Moderati"
    : "Alto Contenuto Carb";

  const reason =
    score >= 70
      ? `Adatto a una dieta low-carb (${netCarbs}g netti per 100g).`
      : score >= 45
        ? `Carb non eccessivi (${netCarbs}g netti per 100g): porzioni controllate.`
        : `Carb troppo alti (${netCarbs}g netti per 100g) per low-carb.`;

  return { score, label, reason };
}

export function assessGlutenFree(
  _v: NutritionValues,
  ingredients?: string,
): GlutenStatus {
  if (!ingredients || !ingredients.trim()) {
    return {
      status: "da_verificare",
      reason: "Ingredienti non disponibili: verificare etichetta completa.",
    };
  }

  const text = ingredients.toLowerCase();
  const blockers = [
    "grano",
    "frumento",
    "glutine",
    "orzo",
    "segale",
    "malto",
    "semola",
    "farro",
    "spelta",
    "couscous",
    "bulgur",
    "kamut",
    "triticale",
    "seitan",
  ];
  for (const word of blockers) {
    if (text.includes(word)) {
      return {
        status: "non_compatibile",
        reason: `Contiene ${word}: non adatto a celiaci.`,
      };
    }
  }

  if (
    text.includes("senza glutine") ||
    text.includes("gluten free") ||
    text.includes("spiga sbarrata")
  ) {
    return {
      status: "compatibile",
      reason: "Etichetta dichiara prodotto senza glutine.",
    };
  }

  const ambiguous = ["aroma", "spezie", "amido modificato", "sciroppo di malto"];
  for (const a of ambiguous) {
    if (text.includes(a)) {
      return {
        status: "da_verificare",
        reason: `Ingredienti ambigui (${a}): consultare il produttore.`,
      };
    }
  }

  return {
    status: "da_verificare",
    reason: "Nessuna dichiarazione esplicita: verificare con il produttore.",
  };
}

export function assessDiabetic(v: NutritionValues): ProfileScore {
  const sugars = Number(v.sugars) || 0;
  const fiber = Number(v.fiber) || 0;
  const netCarbs = computeNetCarbs(v);

  let score = 100;
  if (sugars > 2) score -= (sugars - 2) * 4;
  if (netCarbs > 20) score -= (netCarbs - 20) * 1;
  if (fiber >= 5) score += 5;
  else if (fiber < 2) score -= 5;
  score = clamp(score);

  const label =
    score >= 90 ? "Adatto"
    : score >= 70 ? "OK con moderazione"
    : score >= 45 ? "Attenzione"
    : "Sconsigliato";

  const reason =
    score >= 70
      ? `Zuccheri ${sugars}g e fibre ${fiber}g per 100g: profilo equilibrato.`
      : score >= 45
        ? `Zuccheri ${sugars}g per 100g: consumare con moderazione.`
        : "Zuccheri o carb troppo elevati: profilo glicemico sfavorevole.";

  return { score, label, reason };
}

export function assessLowGI(v: NutritionValues): ProfileScore {
  const netCarbs = computeNetCarbs(v);
  const sugars = Number(v.sugars) || 0;
  const fiber = Number(v.fiber) || 0;
  const protein = Number(v.protein) || 0;

  let score = 100;
  if (netCarbs > 5) score -= (netCarbs - 5) * 3;
  if (sugars > 2) score -= (sugars - 2) * 5;
  if (fiber > 5) score += 5;
  if (protein >= 15) score += 5;
  score = clamp(score);

  const label =
    score >= 90 ? "IG Basso"
    : score >= 70 ? "IG Moderato"
    : score >= 45 ? "IG Medio-Alto"
    : "IG Alto";

  const reason =
    score >= 70
      ? "Bassa risposta glicemica stimata sui macro."
      : score >= 45
        ? "Risposta glicemica media: bilanciare con proteine o grassi."
        : "Probabile spike glicemico: alta presenza di carb a rapido assorbimento.";

  return { score, label, reason };
}

export function assessAllProfiles(
  v: NutritionValues,
  ingredients?: string,
): ProfilesAssessment {
  return {
    keto: assessKeto(v),
    lowCarb: assessLowCarb(v),
    glutenFree: assessGlutenFree(v, ingredients),
    diabetic: assessDiabetic(v),
    lowGI: assessLowGI(v),
  };
}

export function deriveAlerts(v: NutritionValues): string[] {
  const alerts: string[] = [];
  const sugars = Number(v.sugars) || 0;
  const netCarbs = computeNetCarbs(v);
  const satFat = Number(v.satFat) || 0;
  const salt = Number(v.salt) || 0;

  if (sugars > 5) alerts.push(`Zuccheri elevati: ${sugars}g per 100g`);
  if (netCarbs > 20) alerts.push(`Carboidrati netti molto alti: ${netCarbs}g per 100g`);
  if (salt > 1.5) alerts.push(`Sale elevato: ${salt}g per 100g`);
  if (satFat > 20) alerts.push(`Grassi saturi molto elevati: ${satFat}g per 100g`);
  return alerts;
}

export function derivePositives(v: NutritionValues): string[] {
  const positives: string[] = [];
  const protein = Number(v.protein) || 0;
  const fiber = Number(v.fiber) || 0;
  const netCarbs = computeNetCarbs(v);

  if (protein >= 15) positives.push(`Buon apporto proteico: ${protein}g per 100g`);
  if (fiber >= 5) positives.push(`Ricco di fibre: ${fiber}g per 100g`);
  if (netCarbs <= 5) positives.push(`Carboidrati netti bassissimi: ${netCarbs}g per 100g`);
  return positives;
}

export function guessCategoryFromName(name: string | undefined): SoketoCategory {
  const n = (name || "").toLowerCase();
  if (/(pasta|spaghett|penne|fusill|maccheron|tagliatell|rigaton)/.test(n)) return "pasta";
  if (/(pan(e|ino)|crackers|grissin|tostat|focacc|piadin)/.test(n)) return "pane";
  if (/(biscott|snack|barret|merendin|cracker|wafer|cioccol)/.test(n)) return "snack";
  if (/(nutell|crema|burro|spalmabil|marmellat|confettur|hummus)/.test(n)) return "spread";
  if (/(farin|mix per|preparat per)/.test(n)) return "farina";
  if (/(bevand|drink|succ|smoothie|tisan|caff[eè]|the|tea|the freddo)/.test(n)) return "bevande";
  return "altro";
}

export function defaultSuggestion(category: SoketoCategory): string {
  const map: Record<SoketoCategory, string> = {
    pasta: "Prova la nostra Pasta SoKeto® — solo 2.8g di carboidrati netti per 100g.",
    pane: "Sostituiscilo con il Pane Tostato SoKeto®: stesso piacere, frazione dei carboidrati.",
    snack: "I Biscotti SoKeto® sono lo snack perfetto: zero zuccheri aggiunti.",
    spread: "La Crema Nocciole SoKeto® è low-carb e senza olio di palma.",
    farina: "La Farina SoKeto® ti permette di rifare in versione keto qualsiasi ricetta.",
    bevande: "Scopri le bevande funzionali SoKeto®, senza zuccheri aggiunti.",
    altro: "Scopri l'intera linea SoKeto® per una dispensa 100% keto-compliant.",
  };
  return map[category];
}

export type RuleBasedAnalysis = {
  productName: string;
  per100g: NutritionValues;
  netCarbs: number;
  profiles: ProfilesAssessment;
  ketoScore: number;
  ketoLabel: string;
  ketoReason: string;
  alerts: string[];
  positives: string[];
  soketoCategory: SoketoCategory;
  soketoSuggestion: string;
};

export function ruleBasedAnalyze(
  values: NutritionValues,
  productName: string | undefined,
  ingredients?: string,
): RuleBasedAnalysis {
  const netCarbs = computeNetCarbs(values);
  const profiles = assessAllProfiles(values, ingredients);
  const category = guessCategoryFromName(productName);
  return {
    productName: productName?.trim() || "Prodotto sconosciuto",
    per100g: values,
    netCarbs,
    profiles,
    ketoScore: profiles.keto.score,
    ketoLabel: profiles.keto.label,
    ketoReason: profiles.keto.reason,
    alerts: deriveAlerts(values),
    positives: derivePositives(values),
    soketoCategory: category,
    soketoSuggestion: defaultSuggestion(category),
  };
}

export const VALID_GLUTEN_STATUSES: GlutenStatusValue[] = [
  "compatibile",
  "non_compatibile",
  "da_verificare",
];
