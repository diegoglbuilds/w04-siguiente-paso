import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { calculateOrganizeResult } from "@/lib/activity";
import { getFallbackDirections } from "@/lib/directions";
import { NEXT_STEP_STORAGE_KEY } from "@/lib/next-step";

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

const showPossibilities = async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    possibilities: getFallbackDirections(evidence),
    provenance: "fallback",
    evidence,
  }))));
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: /organizar.*disponible.*3 minutos/i }));
  fireEvent.click(screen.getByRole("button", { name: /ver lo que demostré/i }));
  fireEvent.click(screen.getByRole("button", { name: "Ver posibilidades" }));
  await screen.findByText("Posibilidades seguras de respaldo");
};

describe("elección del usuario y siguiente paso", () => {
  it("no selecciona automáticamente y exige una elección explícita", async () => {
    await showPossibilities();
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(3);
    expect(screen.queryByText("Tu siguiente paso sugerido")).toBeNull();
    expect(screen.getByText(/ninguna está seleccionada automáticamente/i)).toBeDefined();
  });

  it("muestra exactamente una acción con tiempo y costo cero tras elegir", async () => {
    await showPossibilities();
    fireEvent.click(screen.getByRole("button", { name: "Elegir Control de inventario" }));

    expect(screen.getByText("Crea un inventario simulado de diez productos")).toBeDefined();
    expect(screen.getByText("Tiempo estimado: 20 minutos")).toBeDefined();
    expect(screen.getByText("Costo: $0 MXN")).toBeDefined();
    expect(document.querySelectorAll(".next-step-card")).toHaveLength(1);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    const ctas = screen.getAllByRole("button").map((button) => button.textContent ?? "").join(" ");
    expect(ctas).not.toMatch(/pagar|comprar|inscrib|curso|postular|solicitar empleo/i);
  });

  it("permite cambiar de dirección y reemplaza, no acumula, la acción", async () => {
    await showPossibilities();
    fireEvent.click(screen.getByRole("button", { name: "Elegir Apoyo en operaciones" }));
    expect(screen.getByText("Ordena cinco pendientes de práctica")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Elegir Seguimiento de pedidos" }));
    expect(screen.queryByText("Ordena cinco pendientes de práctica")).toBeNull();
    expect(screen.getByText("Redacta tres avisos de seguimiento")).toBeDefined();
    expect(document.querySelectorAll(".next-step-card")).toHaveLength(1);
  });

  it("guarda sólo el ID y restaura una selección válida", async () => {
    await showPossibilities();
    fireEvent.click(screen.getByRole("button", { name: "Elegir Apoyo en operaciones" }));
    expect(JSON.parse(window.localStorage.getItem(NEXT_STEP_STORAGE_KEY) ?? "null")).toEqual({ directionId: "operations-support" });

    cleanup();
    render(<Home />);
    await screen.findByLabelText("Siguiente paso guardado");
    expect(screen.getByText("Guardado en este dispositivo")).toBeDefined();
    expect(screen.getByText("Ordena cinco pendientes de práctica")).toBeDefined();
  });

  it("descarta almacenamiento manipulado sin restaurarlo", async () => {
    window.localStorage.setItem(NEXT_STEP_STORAGE_KEY, JSON.stringify({ directionId: "unknown", biography: "dato" }));
    render(<Home />);

    await waitFor(() => expect(window.localStorage.getItem(NEXT_STEP_STORAGE_KEY)).toBeNull());
    expect(screen.queryByLabelText("Siguiente paso guardado")).toBeNull();
  });
});
