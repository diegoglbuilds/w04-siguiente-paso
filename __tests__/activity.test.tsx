import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "@/app/page";

afterEach(cleanup);

const enterOrganizeActivity = () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("link", { name: /dar mi primer paso/i }));
  expect(document.querySelector("#actividades")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /organizar.*disponible.*3 minutos/i }));
};

describe("microactividad Organizar", () => {
  it("entra desde el CTA, muestra las tres familias y sólo habilita Organizar", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("link", { name: /dar mi primer paso/i }));

    expect(screen.getByText("Organizar")).toBeDefined();
    expect(screen.getByText("Resolver")).toBeDefined();
    expect(screen.getByText("Planear")).toBeDefined();
    expect(screen.getAllByText("Disponible próximamente")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /resolver/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /planear/i })).toBeNull();
  });

  it("identifica visiblemente la actividad y el resultado como simulados", () => {
    enterOrganizeActivity();
    expect(screen.getByText(/actividad simulada · 3 minutos/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /ver lo que demostré/i }));
    expect(screen.getByText("Resultado simulado")).toBeDefined();
    expect(screen.getByText(/no una calificación ni una conclusión sobre ti/i)).toBeDefined();
  });

  it("permite corregir respuestas y recalcula las señales", () => {
    enterOrganizeActivity();
    fireEvent.click(screen.getByRole("button", { name: /ver lo que demostré/i }));
    expect(screen.getByText("Detectaste información faltante")).toBeDefined();
    expect(screen.getByText("Consideraste el seguimiento")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /cambiar mis respuestas/i }));
    fireEvent.click(screen.getByLabelText("Dejarlo sin revisar"));
    fireEvent.click(screen.getByLabelText("Continuar sin avisar"));
    fireEvent.click(screen.getByRole("button", { name: /ver lo que demostré/i }));

    expect(screen.getByText("Comparaste prioridades")).toBeDefined();
    expect(screen.queryByText("Detectaste información faltante")).toBeNull();
    expect(screen.queryByText("Consideraste el seguimiento")).toBeNull();
  });

  it("no presenta preguntas personales ni puntajes de la persona", () => {
    enterOrganizeActivity();
    const copy = document.body.textContent?.toLocaleLowerCase("es") ?? "";
    const answerNames = screen.getAllByRole("radio").map((radio) => radio.getAttribute("aria-label") ?? radio.parentElement?.textContent?.toLocaleLowerCase("es") ?? "");

    expect(answerNames.some((name) => /nombre|teléfono|por qué dejaste|por qué no trabajas|historia personal/.test(name))).toBe(false);
    expect(copy).not.toMatch(/puntaje de empleabilidad|potencial futuro|empleabilityscore|futurepotentialscore/);
  });
});
