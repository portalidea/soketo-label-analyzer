export type SoketoCategory =
  | "pasta"
  | "pane"
  | "snack"
  | "spread"
  | "farina"
  | "bevande"
  | "altro";

export type KetoLabel = "Keto Friendly" | "Keto OK" | "Con Moderazione" | "Non Keto";

export type ProfileKey = "keto" | "lowCarb" | "diabetic" | "lowGI";

export type ProfileScore = {
  score: number;
  label: string;
  reason: string;
};

export type GlutenStatusValue = "compatibile" | "non_compatibile" | "da_verificare";

export type GlutenStatus = {
  status: GlutenStatusValue;
  reason: string;
};

export type ProfilesAssessment = {
  keto: ProfileScore;
  lowCarb: ProfileScore;
  glutenFree: GlutenStatus;
  diabetic: ProfileScore;
  lowGI: ProfileScore;
};

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

  profiles: ProfilesAssessment;

  ketoScore: number;
  ketoLabel: string;
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
