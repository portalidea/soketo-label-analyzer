import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResponse, NutritionValues } from "./types";

export const ANALYZE_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

const SYSTEM_PROMPT = `Sei un esperto di nutrizione clinica. Analizza l'etichetta nutrizionale di un prodotto alimentare italiano per cinque profili dietetici contemporanei.

Restituisci ESCLUSIVAMENTE un oggetto JSON valido (no markdown, no testo esplicativo, no code fence) con questa struttura ESATTA:

{
  "productName": "string",
  "per100g": { "calories": number, "carbs": number, "sugars": number, "fiber": number, "fat": number, "satFat": number, "protein": number, "salt": number },
  "netCarbs": number,
  "profiles": {
    "keto": { "score": 0-100, "label": "string", "reason": "string max 150 char" },
    "lowCarb": { "score": 0-100, "label": "string", "reason": "string max 150 char" },
    "glutenFree": { "status": "compatibile" | "non_compatibile" | "da_verificare", "reason": "string max 150 char" },
    "diabetic": { "score": 0-100, "label": "string", "reason": "string max 150 char" },
    "lowGI": { "score": 0-100, "label": "string", "reason": "string max 150 char" }
  },
  "alerts": ["string"],
  "positives": ["string"],
  "soketoCategory": "pasta" | "pane" | "snack" | "spread" | "farina" | "bevande" | "altro",
  "soketoSuggestion": "string"
}

netCarbs = carbs - fiber (mai negativo).

CRITERI KETO (carb netti per 100g):
- 90-100: <5g carb netti, no zuccheri aggiunti, label "Keto Friendly"
- 70-89: 5-10g carb netti, label "Keto OK"
- 45-69: 10-20g carb netti, label "Con Moderazione"
- 0-44: >20g carb netti, label "Non Keto"

CRITERI LOW-CARB (più permissivo del keto, per 100g):
- 90-100: <10g carb netti, label "Low-Carb Ottimo"
- 70-89: 10-20g carb netti, label "Low-Carb OK"
- 45-69: 20-35g carb netti, label "Carb Moderati"
- 0-44: >35g carb netti, label "Alto Contenuto Carb"

CRITERI SENZA GLUTINE (stato ternario, NON score):
- "compatibile": l'etichetta dichiara esplicitamente "senza glutine" / "gluten free" / "spiga sbarrata", OPPURE gli ingredienti sono chiaramente privi di grano/orzo/segale/avena/farro/spelta/kamut/triticale/seitan/frumento/semola/malto/couscous/bulgur
- "non_compatibile": presenza esplicita di grano, frumento, farina di grano, glutine, orzo, segale, malto, semola, farro, spelta, couscous, bulgur, kamut, triticale, seitan
- "da_verificare": ingredienti ambigui (aromi, spezie, amido modificato non specificato, sciroppo di malto), etichetta poco leggibile, oppure rischio di contaminazione crociata documentato ("può contenere tracce di glutine")

REGOLA CRITICA: NON dichiarare mai "compatibile" se hai dubbi. Il default in caso di incertezza è "da_verificare". Mai inventare claim di assenza di glutine non supportati dall'etichetta.

CRITERI DIABETICI (zuccheri + IG stimato + fibre, per 100g):
- 90-100: <2g zuccheri, fibre >5g, IG basso stimato, label "Adatto"
- 70-89: 2-5g zuccheri, fibre presenti, IG moderato, label "OK con moderazione"
- 45-69: 5-15g zuccheri, IG medio-alto, label "Attenzione"
- 0-44: >15g zuccheri o presenza di sciroppo di glucosio/maltodestrine, label "Sconsigliato"

CRITERI INDICE GLICEMICO (basato su tipo carboidrati e processazione):
- 90-100: prevalentemente proteine/grassi, fibre intere, frutta a basso IG, label "IG Basso"
- 70-89: cereali integrali, legumi, IG moderato stimato, label "IG Moderato"
- 45-69: pane/pasta raffinati, IG medio-alto stimato, label "IG Medio-Alto"
- 0-44: zuccheri raffinati, sciroppi, farina 00, riso bianco, IG alto stimato, label "IG Alto"

ALERTS (segnala se presenti, in italiano):
- Zuccheri >5g/100g
- Maltodestrine, sciroppo di glucosio, sciroppo di mais, fruttosio
- Amidi modificati non specificati
- Oli idrogenati, grassi trans
- Dolcificanti artificiali (aspartame, sucralosio in eccesso)
- Sale >1.5g/100g

POSITIVES (segnala se presenti, in italiano):
- Alto contenuto proteico (>15g/100g)
- Fibre alte (>5g/100g)
- Grassi buoni (olio EVO, MCT, omega-3)
- Ingredienti naturali e riconoscibili
- Senza zuccheri aggiunti dichiarato

soketoCategory: scegli la categoria più affine al prodotto.
soketoSuggestion: una frase breve (max 150 caratteri) che suggerisca il prodotto SoKeto® più adatto come alternativa.

Se i dati sono illeggibili o mancanti, restituisci comunque il JSON con i campi obbligatori valorizzati al meglio possibile (usa 0 per i numeri non leggibili) e per il glutine usa "da_verificare".`;

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
