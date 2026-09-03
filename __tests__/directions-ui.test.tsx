import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("ignora una respuesta vieja cuando ya existe un resultado más reciente", async () => {
    type ResolveResponse = (response: Response) => void;
    const pending: ResolveResponse[] = [];
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => pending.push(resolve))));
    reachResult();
    fireEvent.click(screen.getByRole("button", { name: "Ver posibilidades" }));

    fireEvent.click(screen.getByRole("button", { name: /cambiar mis respuestas/i }));
    fireEvent.click(screen.getByLabelText("Dejarlo sin revisar"));
    fireEvent.click(screen.getByRole("button", { name: /ver lo que demostré/i }));
    fireEvent.click(screen.getByRole("button", { name: "Ver posibilidades" }));

    const newerEvidence = calculateOrganizeResult({
      ...activityResult.answers,
      missingInfo: "leave-order-unchanged",
    });
    if (!newerEvidence) throw new Error("New fixture must be valid");

    await act(async () => pending[1](new Response(JSON.stringify({
      possibilities: getFallbackDirections(newerEvidence),
      provenance: "fallback",
      evidence: newerEvidence,
    }))));
    await screen.findByText(/aparece como una posibilidad para practicar la revisión ordenada/i);

    await act(async () => pending[0](new Response(JSON.stringify({
      possibilities: getFallbackDirections(activityResult),
      provenance: "fallback",
      evidence: activityResult,
    }))));

    expect(screen.getByText(/aparece como una posibilidad para practicar la revisión ordenada/i)).toBeDefined();
    expect(screen.queryByText(/aparece porque confirmaste información faltante/i)).toBeNull();
  });

  it("evita solicitudes repetidas e ignora la pendiente al volver a la actividad", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    reachResult();

    const loadButton = screen.getByRole("button", { name: "Ver posibilidades" });
    fireEvent.click(loadButton);
    fireEvent.click(loadButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /cambiar mis respuestas/i }));
    expect(screen.getByRole("heading", { name: "Organizar pendientes" })).toBeDefined();

    await act(async () => resolveRequest?.(new Response(JSON.stringify({
      possibilities: getFallbackDirections(activityResult),
      provenance: "fallback",
      evidence: activityResult,
    }))));

    expect(screen.getByRole("heading", { name: "Organizar pendientes" })).toBeDefined();
    expect(screen.queryByText("Posibilidades seguras de respaldo")).toBeNull();
  });
});
