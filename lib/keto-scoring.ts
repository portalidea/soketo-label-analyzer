import type { KetoLabel, NutritionValues, SoketoCategory } from "./types";

export function computeNetCarbs(v: NutritionValues): number {
  const carbs = Number(v.carbs) || 0;
  const fiber = Number(v.fiber) || 0;
  return Math.max(0, +(carbs - fiber).toFixed(1));
}

export function calculateKetoScore(v: NutritionValues): {
  score: number;
  label: KetoLabel;
  reason: string;
  netCarbs: number;
} {
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

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label: KetoLabel;
  let reason: string;
  if (score >= 75) {
    label = "Keto Friendly";
    reason = `Ottimo profilo keto: ${netCarbs}g carb netti per 100g e bilancio macro favorevole.`;
  } else if (score >= 45) {
    label = "Con Moderazione";
    reason = `Carboidrati moderati (${netCarbs}g netti per 100g): consumare in piccole porzioni.`;
  } else {
    label = "Non Keto";
    reason = `Troppi carboidrati netti (${netCarbs}g per 100g) per la dieta chetogenica.`;
  }

  return { score, label, reason, netCarbs };
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
    pane:
      "Sostituiscilo con il Pane Tostato SoKeto®: stesso piacere, frazione dei carboidrati.",
    snack: "I Biscotti SoKeto® sono lo snack perfetto: zero zuccheri aggiunti.",
    spread: "La Crema Nocciole SoKeto® è low-carb e senza olio di palma.",
    farina: "La Farina SoKeto® ti permette di rifare in versione keto qualsiasi ricetta.",
    bevande: "Scopri le bevande funzionali SoKeto®, senza zuccheri aggiunti.",
    altro: "Scopri l'intera linea SoKeto® per una dispensa 100% keto-compliant.",
  };
  return map[category];
}

export function ruleBasedAnalyze(
  values: NutritionValues,
  productName: string | undefined,
) {
  const { score, label, reason, netCarbs } = calculateKetoScore(values);
  const category = guessCategoryFromName(productName);
  return {
    productName: productName?.trim() || "Prodotto sconosciuto",
    per100g: values,
    netCarbs,
    ketoScore: score,
    ketoLabel: label,
    ketoReason: reason,
    alerts: deriveAlerts(values),
    positives: derivePositives(values),
    soketoCategory: category,
    soketoSuggestion: defaultSuggestion(category),
  };
}
