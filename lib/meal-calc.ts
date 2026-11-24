// Tipi e calcoli del pasto, senza dipendenze server (usabili anche nel browser).

/** Un alimento riconosciuto nel piatto: valori per 100 g, scalati dai grammi. */
export type MealItem = {
  name: string;
  grams: number;
  per100g: {
    calories: number;
    carbs: number;
    fiber: number;
    protein: number;
    fat: number;
  };
};

export type MealResponse = {
  dishName: string;
  items: MealItem[];
  notes: string[];
  ketoTip: string;
  confidence: "alta" | "media" | "bassa";
};

export type MealTotals = {
  calories: number;
  carbs: number;
  fiber: number;
  netCarbs: number;
  protein: number;
  fat: number;
};

/** Totali del pasto dai grammi (ricalcolati lato client quando l'utente li corregge). */
export function mealTotals(items: MealItem[]): MealTotals {
  const t = items.reduce(
    (acc, it) => {
      const f = it.grams / 100;
      acc.calories += it.per100g.calories * f;
      acc.carbs += it.per100g.carbs * f;
      acc.fiber += it.per100g.fiber * f;
      acc.protein += it.per100g.protein * f;
      acc.fat += it.per100g.fat * f;
      return acc;
    },
    { calories: 0, carbs: 0, fiber: 0, protein: 0, fat: 0 },
  );
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: Math.round(t.calories),
    carbs: round1(t.carbs),
    fiber: round1(t.fiber),
    netCarbs: round1(Math.max(0, t.carbs - t.fiber)),
    protein: round1(t.protein),
    fat: round1(t.fat),
  };
}

/** Giudizio keto sul singolo pasto (carboidrati netti totali). */
export function mealKetoVerdict(netCarbs: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (netCarbs <= 10) return { label: "Keto Friendly", tone: "good" };
  if (netCarbs <= 20) return { label: "Con Moderazione", tone: "warn" };
  return { label: "Non Keto", tone: "bad" };
}
