import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("OpenAPI spec", () => {
  it("define rutas principales de la API", () => {
    const spec = readFileSync(join(process.cwd(), "docs", "openapi.yaml"), "utf8");
    expect(spec).toContain("/perfil:");
    expect(spec).toContain("/certificado/generar:");
    expect(spec).toContain("ApiResponse");
  });
});
