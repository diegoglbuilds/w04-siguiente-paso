import { describe, expect, it } from "vitest";
import { calculateOrganizeResult, validateOrganizeAnswers } from "@/lib/activity";

const validAnswers = {
  firstTask: "complete-today-order",
  missingInfo: "confirm-missing-products",
  updateAction: "notify-and-record",
} as const;

describe("datos estructurados de Organizar", () => {
  it("produce siempre el mismo resultado para las mismas respuestas válidas", () => {
    const first = calculateOrganizeResult(validAnswers);
    const second = calculateOrganizeResult({ ...validAnswers });

    expect(first).toEqual(second);
    expect(first).toEqual({
      activity: "organize",
      simulated: true,
      answers: validAnswers,
      demonstratedSignals: ["prioritization", "information-check", "follow-through"],
    });
  });

  it.each([
    null,
    { ...validAnswers, firstTask: "manipulated-value" },
    { ...validAnswers, biography: "texto no permitido" },
    { firstTask: validAnswers.firstTask },
  ])("rechaza valores inválidos o manipulados", (payload) => {
    expect(validateOrganizeAnswers(payload).success).toBe(false);
    expect(calculateOrganizeResult(payload)).toBeNull();
  });
});
