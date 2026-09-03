import { NextResponse } from "next/server";
import { validateActivityResultRequest } from "@/lib/directions";
import { generateDirections } from "@/lib/openai-directions";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud debe contener JSON válido." }, { status: 400 });
  }

  const validated = validateActivityResultRequest(body);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  return NextResponse.json(await generateDirections(validated.data));
}
