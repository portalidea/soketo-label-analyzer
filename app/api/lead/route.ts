import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const LeadSchema = z.object({
  email: z.string().email("Email non valida"),
  source: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Richiesta non valida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  console.log("[lead]", JSON.stringify({ ...parsed.data, ts: new Date().toISOString() }));

  return NextResponse.json({ ok: true });
}
