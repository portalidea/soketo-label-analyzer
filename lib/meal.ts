import Anthropic from "@anthropic-ai/sdk";
import { ANALYZE_MODEL } from "./anthropic";
import type { MealItem, MealResponse } from "./meal-calc";

export type { MealItem, MealResponse } from "./meal-calc";

const MAX_TOKENS = 2048;

const MEAL_PROMPT = `Sei un nutrizionista esperto di alimentazione italiana e chetogenica. Ricevi la foto di un piatto o di un pasto.

Riconosci gli alimenti visibili e stima il peso di ciascuno (in grammi, cotto/come servito), usando riferimenti visivi (piatto, posate, mani) per le proporzioni. Per ogni alimento indica i valori nutrizionali medi PER 100 g dell'alimento come servito.

Includi come voce separata i condimenti probabili ma poco visibili (es. "Olio extravergine (stimato)") quando il piatto è chiaramente condito, con una stima prudente.

Restituisci ESCLUSIVAMENTE un oggetto JSON valido (niente markdown, niente testo extra) con questa struttura:

{
  "dishName": "string, nome del piatto in italiano",
  "items": [
    { "name": "string", "grams": number, "per100g": { "calories": number, "carbs": number, "fiber": number, "protein": number, "fat": number } }
  ],
  "notes": ["string, max 3 note brevi su incertezze o ingredienti nascosti"],
  "ketoTip": "string, max 160 caratteri: un consiglio pratico per rendere il pasto più keto (es. sostituire pasta/pane con un'alternativa low carb)",
  "confidence": "alta" | "media" | "bassa"
}

Regole:
- carbs = carboidrati totali, fiber = fibre, entrambi in grammi per 100 g.
- Massimo 10 voci. Raggruppa elementi minori simili.
- Se la foto non mostra cibo, restituisci items vuoto e dishName "Nessun piatto riconosciuto".
- Non inventare precisione: "confidence" bassa se il piatto è poco visibile o molto composito.`;

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  if (!cachedClient) {
    cachedClient = new Anthropic();
  }
  return cachedClient;
}

export async function analyzeMealPhoto(input: {
  image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}): Promise<MealResponse> {
  const response = await getClient().messages.create({
    model: ANALYZE_MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: "text", text: MEAL_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: input.mediaType, data: input.image },
          },
          {
            type: "text",
            text: "Analizza questo piatto e restituisci SOLO il JSON richiesto.",
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return sanitizeMeal(parseJson(text));
}

function parseJson(raw: string): unknown {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) cleaned = cleaned.slice(first, last + 1);
  return JSON.parse(cleaned);
}

function num(value: unknown, min = 0, max = 10000): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeMeal(raw: unknown): MealResponse {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(r.items) ? r.items.slice(0, 10) : [];
  const items: MealItem[] = itemsRaw
    .map((it) => {
      const i = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      const p = (i.per100g && typeof i.per100g === "object" ? i.per100g : {}) as Record<
        string,
        unknown
      >;
      const carbs = num(p.carbs, 0, 100);
      return {
        name: String(i.name ?? "").slice(0, 80) || "Alimento",
        grams: Math.round(num(i.grams, 0, 2000)),
        x: i.x === undefined ? undefined : Math.round(num(i.x, 3, 97)),
        y: i.y === undefined ? undefined : Math.round(num(i.y, 3, 97)),
        per100g: {
          calories: num(p.calories, 0, 900),
          carbs,
          fiber: Math.min(num(p.fiber, 0, 100), carbs),
          protein: num(p.protein, 0, 100),
          fat: num(p.fat, 0, 100),
        },
      };
    })
    .filter((it) => it.grams > 0);

  const conf = r.confidence;
  return {
    dishName: String(r.dishName ?? "").slice(0, 120) || "Piatto",
    items,
    notes: Array.isArray(r.notes) ? r.notes.slice(0, 3).map((n) => String(n).slice(0, 200)) : [],
    ketoTip: String(r.ketoTip ?? "").slice(0, 200),
    confidence: conf === "alta" || conf === "bassa" ? conf : "media",
  };
}
