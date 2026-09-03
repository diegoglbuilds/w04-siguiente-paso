import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/directions/route";
import { calculateOrganizeResult } from "@/lib/activity";

afterEach(() => vi.unstubAllEnvs());

const activityResult = calculateOrganizeResult({
  firstTask: "complete-today-order",
  missingInfo: "confirm-missing-products",
  updateAction: "notify-and-record",
});

if (!activityResult) throw new Error("Test fixture must be valid");

const request = (body: unknown) => new Request("http://localhost/api/directions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("POST /api/directions", () => {
  it("devuelve respaldo seguro para una solicitud válida sin clave", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(request({ activityResult }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.provenance).toBe("fallback");
    expect(body.possibilities).toHaveLength(3);
    expect(body.evidence).toEqual(activityResult);
  });

  it.each([
    { activityResult, personalHistory: "texto no aceptado" },
    { activityResult: { ...activityResult, employabilityScore: 80 } },
    { activityResult: { ...activityResult, answers: { ...activityResult.answers, biography: "texto" } } },
    { activityResult: { ...activityResult, activity: "unknown" } },
  ])("rechaza payloads manipulados y campos de historia personal", async (payload) => {
    const response = await POST(request(payload));
    expect(response.status).toBe(400);
  });

  it("rechaza JSON malformado", async () => {
    const response = await POST(new Request("http://localhost/api/directions", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
  });
});
