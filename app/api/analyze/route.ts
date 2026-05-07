import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeManual, analyzePhoto } from "@/lib/anthropic";
import {
  assessAllProfiles,
  computeNetCarbs,
  ruleBasedAnalyze,
  VALID_GLUTEN_STATUSES,
} from "@/lib/profile-scoring";
import { findSoketoProduct } from "@/lib/soketo-products";
import type {
  AnalyzeResponse,
  GlutenStatus,
  NutritionValues,
  ProfileScore,
  ProfilesAssessment,
  SoketoCategory,
} from "@/lib/types";

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
        ruleBasedAnalyze(input.values, input.productName) as AnalyzeResponse,
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

  const profiles = sanitizeProfiles(result.profiles, per100g);

  const soketoCategory: SoketoCategory = VALID_CATEGORIES.includes(
    result.soketoCategory as SoketoCategory,
  )
    ? (result.soketoCategory as SoketoCategory)
    : "altro";

  return {
    productName: (result.productName || "Prodotto sconosciuto").slice(0, 120),
    per100g,
    netCarbs,
    profiles,
    ketoScore: profiles.keto.score,
    ketoLabel: profiles.keto.label,
    ketoReason: profiles.keto.reason,
    alerts: Array.isArray(result.alerts) ? result.alerts.slice(0, 8) : [],
    positives: Array.isArray(result.positives) ? result.positives.slice(0, 8) : [],
    soketoCategory,
    soketoSuggestion: (result.soketoSuggestion || "").slice(0, 240),
  };
}

function sanitizeProfiles(
  raw: unknown,
  per100g: NutritionValues,
): ProfilesAssessment {
  const computed = assessAllProfiles(per100g);
  const r = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

  return {
    keto: pickProfileScore(r.keto, computed.keto),
    lowCarb: pickProfileScore(r.lowCarb, computed.lowCarb),
    glutenFree: pickGlutenStatus(r.glutenFree, computed.glutenFree),
    diabetic: pickProfileScore(r.diabetic, computed.diabetic),
    lowGI: pickProfileScore(r.lowGI, computed.lowGI),
  };
}

function pickProfileScore(raw: unknown, fallback: ProfileScore): ProfileScore {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const score = clamp(Math.round(numberOr(r.score, fallback.score)), 0, 100);
  const label =
    typeof r.label === "string" && r.label.trim() ? r.label.slice(0, 60) : fallback.label;
  const reason =
    typeof r.reason === "string" && r.reason.trim()
      ? r.reason.slice(0, 200)
      : fallback.reason;
  return { score, label, reason };
}

function pickGlutenStatus(raw: unknown, fallback: GlutenStatus): GlutenStatus {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const status =
    typeof r.status === "string" &&
    (VALID_GLUTEN_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as GlutenStatus["status"])
      : "da_verificare";
  const reason =
    typeof r.reason === "string" && r.reason.trim()
      ? r.reason.slice(0, 200)
      : fallback.reason;
  return { status, reason };
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
