export type SoketoCategory =
  | "pasta"
  | "pane"
  | "snack"
  | "spread"
  | "farina"
  | "bevande"
  | "altro";

export type KetoLabel = "Keto Friendly" | "Con Moderazione" | "Non Keto";

export type NutritionValues = {
  calories?: number;
  carbs: number;
  sugars?: number;
  fiber?: number;
  fat?: number;
  satFat?: number;
  protein: number;
  salt?: number;
};

export type AnalyzeRequest =
  | {
      mode: "photo";
      image: string;
      mediaType: "image/jpeg" | "image/png" | "image/webp";
    }
  | { mode: "manual"; values: NutritionValues; productName?: string };

export type AnalyzeResponse = {
  productName: string;
  per100g: NutritionValues;
  netCarbs: number;
  ketoScore: number;
  ketoLabel: KetoLabel;
  ketoReason: string;
  alerts: string[];
  positives: string[];
  soketoCategory: SoketoCategory;
  soketoSuggestion: string;
  usedFallback?: boolean;
};

export type SoketoProduct = {
  id: string;
  name: string;
  category: SoketoCategory;
  netCarbs: number;
  protein: number;
  fat: number;
  desc: string;
  url: string;
};
