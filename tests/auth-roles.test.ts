import { describe, expect, it } from "vitest";
import { roleGrantsCapability } from "@/lib/auth";

describe("roleGrantsCapability", () => {
  it("decano puede aprobar solicitudes", () => {
    expect(roleGrantsCapability("decano", "aprobar_solicitudes")).toBe(true);
  });

  it("administrativo solo genera solicitudes", () => {
    expect(roleGrantsCapability("administrativo", "generar_solicitudes")).toBe(true);
    expect(roleGrantsCapability("administrativo", "aprobar_solicitudes")).toBe(false);
  });

  it("superusuario tiene acceso amplio", () => {
    expect(roleGrantsCapability("superusuario", "gestionar_usuarios")).toBe(true);
    expect(roleGrantsCapability("superusuario", "revisar_solicitudes")).toBe(true);
  });
});
