import { describe, expect, it } from "vitest";
import { DIRECTION_IDS } from "@/lib/directions";
import {
  getNextStep,
  parseLocalSelection,
  serializeLocalSelection,
} from "@/lib/next-step";

describe("reglas deterministas del siguiente paso", () => {
  it.each(DIRECTION_IDS)("mapea %s a una acción válida, gratuita y breve", (directionId) => {
    const step = getNextStep(directionId);
    expect(step).not.toBeNull();
    expect(step).toMatchObject({ directionId, costMxn: 0, simulated: true });
    expect(step?.estimatedMinutes).toBeGreaterThan(0);
    expect(step?.estimatedMinutes).toBeLessThanOrEqual(20);
    expect(step?.timeHorizon).toMatch(/today|24-48-hours/);
    expect(`${step?.title} ${step?.description}`).not.toMatch(/pagar|comprar|inscrib|curso|postular|solicitar empleo|garantiza/i);
  });

  it("serializa únicamente el ID allowlisted", () => {
    expect(JSON.parse(serializeLocalSelection("inventory-control"))).toEqual({ directionId: "inventory-control" });
  });

  it.each([
    null,
    "not-json",
    JSON.stringify({ directionId: "unknown" }),
    JSON.stringify({ directionId: "operations-support", biography: "dato prohibido" }),
    JSON.stringify({ directionId: "operations-support", nextStep: "texto libre" }),
  ])("descarta estado local desconocido o manipulado", (stored) => {
    expect(parseLocalSelection(stored)).toBeNull();
  });
});
