import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeMealPhoto } from "@/lib/meal";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BASE64_BYTES = Math.ceil(5 * 1024 * 1024 * 1.4);

const MealRequestSchema = z.object({
  image: z.string().min(1).max(MAX_BASE64_BYTES, "Immagine troppo grande (max 5MB)"),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }
  const parsed = MealRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }
  const started = Date.now();
  try {
    const result = await analyzeMealPhoto(parsed.data);
    console.log(`[/api/meal] ok in ${Date.now() - started} ms, ${result.items.length} items`);
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      `[/api/meal] failed after ${Date.now() - started} ms:`,
      err instanceof Error ? err.message : err,
    );
    const status = err instanceof Anthropic.APIError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: "Impossibile analizzare il piatto. Riprova con una foto più nitida." },
      { status },
    );
  }
}
