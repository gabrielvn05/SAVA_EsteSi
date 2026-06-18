import { describe, expect, it } from "vitest";
import {
  perfilInstitucionalCompleto,
  resolverPerfilInstitucional,
  rolToTipoPersonal
} from "@/lib/perfil-institucional";

describe("perfil-institucional", () => {
  it("mapea rol del sistema a tipo de personal del oficio", () => {
    expect(rolToTipoPersonal("docente")).toBe("docente");
    expect(rolToTipoPersonal("mantenimiento")).toBe("mantenimiento");
    expect(rolToTipoPersonal("administrativo")).toBe("administrativo");
    expect(rolToTipoPersonal("secretaria")).toBe("administrativo");
  });

  it("valida perfil institucional completo", () => {
    const completo = resolverPerfilInstitucional({
      rol: "docente",
      cedula: "1234567890",
      carrera: "software"
    });
    expect(perfilInstitucionalCompleto(completo)).toBe(true);

    const incompleto = resolverPerfilInstitucional({ rol: "docente", cedula: "", carrera: "" });
    expect(perfilInstitucionalCompleto(incompleto)).toBe(false);
  });
});
