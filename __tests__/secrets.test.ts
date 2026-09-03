import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("frontera de secretos", () => {
  it("no expone la clave en el componente cliente", () => {
    const clientSource = readFileSync("app/activity-flow.tsx", "utf8");
    expect(clientSource).not.toContain("OPENAI_API_KEY");
    expect(clientSource).not.toContain("process.env");
    expect(clientSource).not.toContain("NEXT_PUBLIC_");
  });

  it("documenta sólo un placeholder vacío y mantiene los env reales ignorados", () => {
    expect(readFileSync(".env.example", "utf8").trim()).toBe("OPENAI_API_KEY=");
    const gitignore = readFileSync(".gitignore", "utf8");
    expect(gitignore).toContain(".env*");
    expect(gitignore).toContain("!.env.example");
  });
});
