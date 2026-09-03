import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { calculateOrganizeResult } from "@/lib/activity";
import { getFallbackDirections } from "@/lib/directions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const activityResult = calculateOrganizeResult({
  firstTask: "complete-today-order",
  missingInfo: "confirm-missing-products",
  updateAction: "notify-and-record",
});

if (!activityResult) throw new Error("Test fixture must be valid");

const reachResult = () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: /organizar.*disponible.*3 minutos/i }));
  fireEvent.click(screen.getByRole("button", { name: /ver lo que demostré/i }));
};

describe("posibilidades en la interfaz", () => {
  it("muestra al menos dos posibilidades con razones, límites y lenguaje no decisorio", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      possibilities: getFallbackDirections(activityResult),
      provenance: "fallback",
      evidence: activityResult,
    }))));
    reachResult();
    fireEvent.click(screen.getByRole("button", { name: "Ver posibilidades" }));

    await waitFor(() => expect(screen.getByText("Posibilidades seguras de respaldo")).toBeDefined());
    expect(screen.getAllByText("¿Por qué apareció?").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Límite").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/son posibilidades, no decisiones/i)).toBeDefined();
    expect(screen.getByText(/tres minutos no puede determinar tu futuro/i)).toBeDefined();
    expect(screen.getByText("Detectaste información faltante")).toBeDefined();
  });

  it("etiqueta como respaldo una falla completa del endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    reachResult();
    fireEvent.click(screen.getByRole("button", { name: "Ver posibilidades" }));
    await waitFor(() => expect(screen.getByText("Posibilidades seguras de respaldo")).toBeDefined());
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });
});
