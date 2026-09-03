import "server-only";

import {
  DIRECTION_OUTPUT_SCHEMA,
  getFallbackDirections,
  validateDirectionOutput,
  type DirectionsResponse,
} from "@/lib/directions";
import type { ActivityResult } from "@/lib/activity";

type FetchLike = typeof fetch;

type GenerateOptions = {
  apiKey?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

const extractOutputText = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const response = value as Record<string, unknown>;
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return null;
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
        return (part as Record<string, unknown>).text as string;
      }
    }
  }
  return null;
};

const fallback = (evidence: ActivityResult): DirectionsResponse => ({
  possibilities: getFallbackDirections(evidence),
  provenance: "fallback",
  evidence,
});

export async function generateDirections(
  evidence: ActivityResult,
  options: GenerateOptions = {},
): Promise<DirectionsResponse> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback(evidence);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  try {
    const response = await (options.fetchImpl ?? fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5-mini",
        store: false,
        instructions: "Genera posibilidades en español sencillo a partir únicamente de la evidencia estructurada. Son opciones para explorar, nunca decisiones, puntajes, garantías laborales ni carreras correctas. Explica la conexión y una limitación visible. No pidas datos personales.",
        input: JSON.stringify(evidence),
        text: {
          format: {
            type: "json_schema",
            name: "direction_possibilities",
            strict: true,
            schema: DIRECTION_OUTPUT_SCHEMA,
          },
        },
      }),
    });
    if (!response.ok) return fallback(evidence);
    const outputText = extractOutputText(await response.json());
    if (!outputText) return fallback(evidence);
    const validated = validateDirectionOutput(JSON.parse(outputText));
    if (!validated.success) return fallback(evidence);
    return { possibilities: validated.data, provenance: "ai", evidence };
  } catch {
    return fallback(evidence);
  } finally {
    clearTimeout(timeout);
  }
}
