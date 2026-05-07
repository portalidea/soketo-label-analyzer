import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResponse, NutritionValues } from "./types";

export const ANALYZE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

const SYSTEM_PROMPT = `Sei un esperto di nutrizione e dieta chetogenica. Il tuo compito è analizzare etichette nutrizionali italiane (per 100g) e restituire ESCLUSIVAMENTE un oggetto JSON valido (no markdown, no testo esplicativo, no code fence).

STRUTTURA JSON ESATTA:
{
  "productName": "string (nome prodotto se leggibile, altrimenti 'Prodotto sconosciuto')",
  "per100g": {
    "calories": number,
    "carbs": number,
    "sugars": number,
    "fiber": number,
    "fat": number,
    "satFat": number,
    "protein": number,
    "salt": number
  },
  "netCarbs": number,
  "ketoScore": number,
  "ketoLabel": "Keto Friendly" | "Con Moderazione" | "Non Keto",
  "ketoReason": "string max 200 caratteri",
  "alerts": ["string"],
  "positives": ["string"],
  "soketoCategory": "pasta" | "pane" | "snack" | "spread" | "farina" | "bevande" | "altro",
  "soketoSuggestion": "string"
}

CRITERI KETO SCORE (0-100):
- 90-100: <5g carb netti/100g, no zuccheri aggiunti, alto grasso buono
- 70-89: 5-10g carb netti/100g, basso indice glicemico
- 45-69: 10-20g carb netti/100g, da consumare con moderazione
- 0-44: >20g carb netti/100g O contiene zucchero/maltodestrine/amidi

netCarbs = carbs - fiber (mai negativo).

CRITERI ALERTS (segnala se presenti negli ingredienti o nei valori):
- Zuccheri >5g/100g
- Maltodestrine, sciroppo di glucosio, fruttosio
- Amidi modificati
- Oli idrogenati o di palma
- Dolcificanti dannosi (aspartame)

CRITERI POSITIVES:
- Alto contenuto proteico (>15g/100g)
- Fibre >5g/100g
- Grassi buoni dichiarati (olio EVO, MCT, cocco)
- Ingredienti naturali e semplici

CRITERI ketoLabel:
- ketoScore >= 75 → "Keto Friendly"
- ketoScore 45-74 → "Con Moderazione"
- ketoScore < 45 → "Non Keto"

CRITERI soketoCategory: scegli la categoria più affine al prodotto.

CRITERI soketoSuggestion: una frase breve (max 150 caratteri) che suggerisca il prodotto SoKeto® più adatto come alternativa.

Se i dati sono illeggibili o mancanti, restituisci comunque il JSON con i campi obbligatori valorizzati al meglio possibile (usa 0 per i numeri non leggibili) e ketoLabel "Non Keto" con un ketoReason esplicativo.`;

export type AnalyzePhotoInput = {
  image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
};

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

export async function analyzePhoto(input: AnalyzePhotoInput): Promise<AnalyzeResponse> {
  const userContent: Anthropic.ContentBlockParam[] = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: input.mediaType,
        data: input.image,
      },
    },
    {
      type: "text",
      text: "Analizza questa etichetta nutrizionale italiana e restituisci SOLO il JSON richiesto, senza testo extra.",
    },
  ];
  return callClaude(userContent);
}

export async function analyzeManual(
  values: NutritionValues,
  productName?: string,
): Promise<AnalyzeResponse> {
  const userContent: Anthropic.ContentBlockParam[] = [
    {
      type: "text",
      text: `Analizza questi valori nutrizionali per 100g (inseriti manualmente dall'utente) e restituisci SOLO il JSON richiesto, senza testo extra.

Nome prodotto: ${productName?.trim() || "Sconosciuto"}
Valori per 100g (in grammi, calorie in kcal):
${JSON.stringify(values, null, 2)}`,
    },
  ];
  return callClaude(userContent);
}

async function callClaude(
  userContent: Anthropic.ContentBlockParam[],
): Promise<AnalyzeResponse> {
  const client = getClient();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userContent }];

  const response = await client.messages.create({
    model: ANALYZE_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return parseAnalyzeJson(text);
}

function parseAnalyzeJson(raw: string): AnalyzeResponse {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  const parsed = JSON.parse(cleaned) as AnalyzeResponse;
  return parsed;
}

export { Anthropic };
