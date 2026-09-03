import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "@/app/page";

afterEach(cleanup);

describe("entrada privada de Siguiente Paso", () => {
  it("abre con una acción hacia adelante y sin pedir una confesión", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name:"Empieza por lo que puedes hacer hoy." })).toBeDefined();
    expect(screen.getByRole("link", { name:/dar mi primer paso/i }).getAttribute("href")).toBe("#actividades");
    expect(screen.getByText(/no necesitas explicar por qué dejaste la escuela o un trabajo/i)).toBeDefined();
    expect(screen.getByText(/acción breve, no con preguntas sobre tu pasado/i)).toBeDefined();
  });
  it("explica privacidad y simulación sin solicitar datos personales", () => {
    const { container } = render(<Home />);
    expect(screen.getByText(/no te pediremos nombre, teléfono, documentos ni datos personales/i)).toBeDefined();
    expect(screen.getAllByText(/demo|demostración|simulad/i).length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector("input, textarea, select, form")).toBeNull();
  });
  it("preserva la elección de la persona y evita etiquetas o decisiones", () => {
    const { container } = render(<Home />);
    expect(screen.getByText(/tú decides qué explorar/i)).toBeDefined();
    expect(screen.getByText(/nunca una decisión sobre tu futuro/i)).toBeDefined();
    expect(container.textContent?.toLocaleLowerCase("es")).not.toContain("nini");
  });
});
