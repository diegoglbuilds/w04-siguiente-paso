import { describe, expect, it, vi } from "vitest";
import { calculateOrganizeResult } from "@/lib/activity";
import {
  getFallbackDirections,
  validateActivityResultRequest,
  validateDirectionOutput,
} from "@/lib/directions";
import { generateDirections } from "@/lib/openai-directions";

const activityResult = calculateOrganizeResult({
  firstTask: "complete-today-order",
  missingInfo: "confirm-missing-products",
  updateAction: "notify-and-record",
});

if (!activityResult) throw new Error("Test fixture must be valid");

const modelPossibilities = {
  possibilities: [
    {
      id: "operations-support",
      title: "Apoyo en operaciones",
      reason: "Aparece porque comparaste prioridades dentro de la actividad simulada.",
      confidenceLabel: "demo",
      limitations: "Esta actividad breve no representa todas las situaciones de una operación real.",
    },
    {
      id: "inventory-control",
      title: "Control de inventario",
      reason: "Aparece porque confirmaste la información faltante antes de continuar.",
      confidenceLabel: "low",
      limitations: "No se evaluó experiencia ni el uso de herramientas reales de inventario.",
    },
  ],
};

const openAiResponse = (output: unknown, ok = true) =>
  new Response(JSON.stringify({ output_text: JSON.stringify(output) }), { status: ok ? 200 : 500 });

describe("límite de posibilidades", () => {
  it("acepta únicamente el resultado estructurado exacto y autoritativo", () => {
    expect(validateActivityResultRequest({ activityResult }).success).toBe(true);
    expect(validateActivityResultRequest({ activityResult, biography: "campo prohibido" }).success).toBe(false);
    expect(validateActivityResultRequest({ activityResult: { ...activityResult, activity: "solve" } }).success).toBe(false);
    expect(validateActivityResultRequest({ activityResult: { ...activityResult, demonstratedSignals: ["prioritization"] } }).success).toBe(false);
    expect(validateActivityResultRequest({ activityResult: { ...activityResult, answers: { ...activityResult.answers, firstTask: "manipulated" } } }).success).toBe(false);
  });

  it("usa una respuesta estructurada válida y envía sólo evidencia validada", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.store).toBe(false);
      expect(body.input).toBe(JSON.stringify(activityResult));
      expect(JSON.parse(body.input)).toEqual(activityResult);
      expect(body.text.format.type).toBe("json_schema");
      expect(body.text.format.strict).toBe(true);
      expect(body.input).not.toMatch(/name|age|location|biography|school|employment|failureReason/i);
      return openAiResponse(modelPossibilities);
    });

    const result = await generateDirections(activityResult, { apiKey: "test-key", fetchImpl: fetchMock as typeof fetch });
    expect(result.provenance).toBe("ai");
    expect(result.possibilities).toEqual(modelPossibilities.possibilities);
    expect(result.evidence).toEqual(activityResult);
  });

  it("usa respaldo determinista sin clave, ante error de API y ante salida malformada", async () => {
    const expected = getFallbackDirections(activityResult);
    expect(await generateDirections(activityResult, { apiKey: "" })).toMatchObject({ provenance: "fallback", possibilities: expected });

    const failedFetch = vi.fn(async () => { throw new Error("network failed"); });
    expect(await generateDirections(activityResult, { apiKey: "test", fetchImpl: failedFetch as unknown as typeof fetch })).toMatchObject({ provenance: "fallback", possibilities: expected });

    const malformedFetch = vi.fn(async () => openAiResponse({ possibilities: [{ id: "unknown" }] }));
    expect(await generateDirections(activityResult, { apiKey: "test", fetchImpl: malformedFetch as unknown as typeof fetch })).toMatchObject({ provenance: "fallback", possibilities: expected });

    const httpFailure = vi.fn(async () => openAiResponse({}, false));
    expect(await generateDirections(activityResult, { apiKey: "test", fetchImpl: httpFailure as unknown as typeof fetch })).toMatchObject({ provenance: "fallback", possibilities: expected });

    const invalidJson = vi.fn(async () => new Response("{", { status: 200 }));
    expect(await generateDirections(activityResult, { apiKey: "test", fetchImpl: invalidJson as unknown as typeof fetch })).toMatchObject({ provenance: "fallback", possibilities: expected });
  });

  it("cancela por timeout y usa respaldo determinista", async () => {
    const hangingFetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));

    const result = await generateDirections(activityResult, {
      apiKey: "test",
      fetchImpl: hangingFetch as typeof fetch,
      timeoutMs: 1,
    });

    expect(result.provenance).toBe("fallback");
    expect(result.possibilities).toEqual(getFallbackDirections(activityResult));
  });

  it("rechaza lenguaje que intenta decidir o puntuar a la persona", () => {
    const forcedDecision = {
      possibilities: [
        { ...modelPossibilities.possibilities[0], reason: "Debes trabajar aquí porque es la carrera correcta para ti." },
        modelPossibilities.possibilities[1],
      ],
    };
    expect(validateDirectionOutput(forcedDecision).success).toBe(false);
  });

  it("rechaza campos de puntaje o decisión aunque acompañen posibilidades válidas", async () => {
    const unsafeOutput = {
      ...modelPossibilities,
      employabilityScore: 92,
    };
    expect(validateDirectionOutput(unsafeOutput).success).toBe(false);

    const unsafeItemOutput = {
      possibilities: [{ ...modelPossibilities.possibilities[0], recommendedCareer: "La carrera correcta" }, modelPossibilities.possibilities[1]],
    };
    expect(validateDirectionOutput(unsafeItemOutput).success).toBe(false);

    const fetchMock = vi.fn(async () => openAiResponse(unsafeOutput));
    const result = await generateDirections(activityResult, { apiKey: "test", fetchImpl: fetchMock as unknown as typeof fetch });
    expect(result.provenance).toBe("fallback");
  });
});
