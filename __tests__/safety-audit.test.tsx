import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { calculateOrganizeResult } from "@/lib/activity";
import { getFallbackDirections } from "@/lib/directions";

const evidence = calculateOrganizeResult({
  firstTask: "complete-today-order",
  missingInfo: "confirm-missing-products",
  updateAction: "notify-and-record",
});

if (!evidence) throw new Error("Test fixture must be valid");

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("auditoría integral de seguridad y Blueprint", () => {
  it("preserva la Shadow Clause, privacidad, simulación y control en el flujo completo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      possibilities: getFallbackDirections(evidence),
      provenance: "fallback",
      evidence,
    }))));
    render(<Home />);

    const forwardCta = screen.getByRole("link", { name: /dar mi primer paso/i });
    expect(forwardCta.getAttribute("href")).toBe("#actividades");
    expect(screen.getByText(/no necesitas explicar por qué dejaste la escuela o un trabajo/i)).toBeDefined();
    expect(screen.getByText(/no te pediremos nombre, teléfono, documentos ni datos personales/i)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /organizar.*disponible.*3 minutos/i }));
    expect(screen.getByText(/actividad simulada · 3 minutos/i)).toBeDefined();
    const answerNames = screen.getAllByRole("radio").map((radio) => radio.parentElement?.textContent?.toLocaleLowerCase("es") ?? "").join(" ");
    expect(answerNames).not.toMatch(/nombre|edad|teléfono|domicilio|biografía|historia escolar|historia laboral|por qué dejaste|fracaso/);

    fireEvent.click(screen.getByRole("button", { name: /ver qué observó la actividad/i }));
    expect(screen.getByText("Resultado simulado")).toBeDefined();
    expect(screen.getByText(/no una calificación ni una conclusión sobre ti/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Ver posibilidades" }));
    await screen.findByText("Posibilidades seguras de respaldo");

    expect(screen.getByText(/son posibilidades, no decisiones/i)).toBeDefined();
    expect(screen.getByText(/tres minutos no puede determinar tu futuro/i)).toBeDefined();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Elegir Apoyo en operaciones" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    expect(screen.getByText("Tu siguiente paso sugerido")).toBeDefined();
    expect(screen.getByText(/puedes elegir otra posibilidad cuando quieras/i)).toBeDefined();

    const ui = document.body.textContent?.toLocaleLowerCase("es") ?? "";
    expect(ui).not.toMatch(/\bnini\b|desempleado como identidad|dropout|estudiante fracasado|trabajador fracasado|programa social|elegibilidad|asistencia gubernamental/);
    expect(ui).not.toMatch(/puntaje de empleabilidad|puntaje de potencial|ranking permanente|carrera correcta/);
    const ctas = screen.getAllByRole("button").map((button) => button.textContent ?? "").join(" ");
    expect(ctas).not.toMatch(/pagar|comprar|tarjeta|inscrib|curso|postular|solicitar empleo/);
  });

  it("mantiene al LLM fuera de la elección y de la acción final", () => {
    const openAiBoundary = readFileSync("lib/openai-directions.ts", "utf8");
    const route = readFileSync("app/api/directions/route.ts", "utf8");
    const client = readFileSync("app/activity-flow.tsx", "utf8");

    expect(openAiBoundary).toContain("input: JSON.stringify(evidence)");
    expect(openAiBoundary).not.toMatch(/selectedDirection|NEXT_STEP|next-step/);
    expect(route).not.toMatch(/selectedDirection|NEXT_STEP|next-step/);
    expect(client).not.toContain("OPENAI_API_KEY");
    expect(client).not.toContain("NEXT_PUBLIC_");
  });
});
