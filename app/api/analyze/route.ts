import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeManual, analyzePhoto } from "@/lib/anthropic";
import { ruleBasedAnalyze, computeNetCarbs } from "@/lib/keto-scoring";
import { findSoketoProduct } from "@/lib/soketo-products";
import type { AnalyzeResponse, NutritionValues, SoketoCategory } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BASE64_BYTES = Math.ceil(5 * 1024 * 1024 * 1.4);

const NutritionSchema = z.object({
  calories: z.number().min(0).optional(),
  carbs: z.number().min(0),
  sugars: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  satFat: z.number().min(0).optional(),
  protein: z.number().min(0),
  salt: z.number().min(0).optional(),
});

const PhotoRequestSchema = z.object({
  mode: z.literal("photo"),
  image: z.string().min(1).max(MAX_BASE64_BYTES, "Immagine troppo grande (max 5MB)"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

const ManualRequestSchema = z.object({
  mode: z.literal("manual"),
  values: NutritionSchema,
  productName: z.string().max(200).optional(),
});

const RequestSchema = z.discriminatedUnion("mode", [PhotoRequestSchema, ManualRequestSchema]);

const VALID_LABELS = ["Keto Friendly", "Con Moderazione", "Non Keto"] as const;
const VALID_CATEGORIES: SoketoCategory[] = [
  "pasta",
  "pane",
  "snack",
  "spread",
  "farina",
  "bevande",
  "altro",
];

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Richiesta non valida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  let usedFallback = false;
  let result: AnalyzeResponse | null = null;

  try {
    if (input.mode === "photo") {
      result = await analyzePhoto({ image: input.image, mediaType: input.mediaType });
    } else {
      result = await analyzeManual(input.values, input.productName);
    }
    result = sanitize(result, input);
  } catch (err) {
    usedFallback = true;
    if (input.mode === "manual") {
      result = sanitize(
        { ...ruleBasedAnalyze(input.values, input.productName) } as AnalyzeResponse,
        input,
      );
    } else {
      console.error(
        "[/api/analyze] photo analysis failed, no fallback available:",
        err instanceof Error ? err.message : err,
      );
      const status =
        err instanceof Anthropic.APIError ? err.status ?? 502 : 500;
      return NextResponse.json(
        {
          error:
            "Impossibile analizzare l'immagine. Prova a inserire i dati manualmente.",
        },
        { status },
      );
    }
  }

  if (!result) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }

  enrichWithSoketoMatch(result);
  result.usedFallback = usedFallback || undefined;

  return NextResponse.json(result);
}

function sanitize(
  result: AnalyzeResponse,
  input: z.infer<typeof RequestSchema>,
): AnalyzeResponse {
  const per100g: NutritionValues = {
    calories: numberOr(result.per100g?.calories, 0),
    carbs: numberOr(
      result.per100g?.carbs,
      input.mode === "manual" ? input.values.carbs : 0,
    ),
    sugars: numberOr(result.per100g?.sugars, 0),
    fiber: numberOr(result.per100g?.fiber, 0),
    fat: numberOr(result.per100g?.fat, 0),
    satFat: numberOr(result.per100g?.satFat, 0),
    protein: numberOr(
      result.per100g?.protein,
      input.mode === "manual" ? input.values.protein : 0,
    ),
    salt: numberOr(result.per100g?.salt, 0),
  };

  const netCarbs =
    typeof result.netCarbs === "number" && !Number.isNaN(result.netCarbs)
      ? Math.max(0, +result.netCarbs.toFixed(1))
      : computeNetCarbs(per100g);

  const ketoScore = clamp(Math.round(numberOr(result.ketoScore, 0)), 0, 100);
  const ketoLabel = (VALID_LABELS as readonly string[]).includes(result.ketoLabel)
    ? result.ketoLabel
    : ketoScore >= 75
      ? "Keto Friendly"
      : ketoScore >= 45
        ? "Con Moderazione"
        : "Non Keto";

  const soketoCategory: SoketoCategory = VALID_CATEGORIES.includes(
    result.soketoCategory as SoketoCategory,
  )
    ? (result.soketoCategory as SoketoCategory)
    : "altro";

  return {
    productName: (result.productName || "Prodotto sconosciuto").slice(0, 120),
    per100g,
    netCarbs,
    ketoScore,
    ketoLabel,
    ketoReason: (result.ketoReason || "").slice(0, 240),
    alerts: Array.isArray(result.alerts) ? result.alerts.slice(0, 8) : [],
    positives: Array.isArray(result.positives) ? result.positives.slice(0, 8) : [],
    soketoCategory,
    soketoSuggestion: (result.soketoSuggestion || "").slice(0, 240),
  };
}

function enrichWithSoketoMatch(result: AnalyzeResponse) {
  const product = findSoketoProduct(result.soketoCategory);
  if (product && !result.soketoSuggestion) {
    result.soketoSuggestion = product.desc;
  }
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
