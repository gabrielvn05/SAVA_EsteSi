import { describe, expect, it } from "vitest";
import { isCedulaValida, isCelularValido, validateAccountRequestForm } from "@/lib/account-request";
import { isEmailConArroba } from "@/lib/form-validators";

describe("account-request validation", () => {
  const base = {
    email: "docente@uleam.edu.ec",
    nombres: "Juan",
    apellidos: "Pérez",
    cedula: "1234567890",
    celular: "0991234567",
    carrera: "software",
    jornada: "",
    rol_solicitado: "administrativo"
  };

  it("acepta solicitud sin jornada", () => {
    const result = validateAccountRequestForm(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.cedula).toBe("1234567890");
      expect(result.data.jornada).toBe("");
    }
  });

  it("rechaza correo sin @", () => {
    const result = validateAccountRequestForm({ ...base, email: "correo-invalido" });
    expect(result).toEqual({ ok: false, aviso: "correo_invalido" });
  });

  it("rechaza datos incompletos", () => {
    const result = validateAccountRequestForm({ ...base, carrera: "" });
    expect(result).toEqual({ ok: false, aviso: "datos_incompletos" });
  });

  it("valida cédula y celular", () => {
    expect(isCedulaValida("1234567890")).toBe(true);
    expect(isCedulaValida("123")).toBe(false);
    expect(isCelularValido("0991234567")).toBe(true);
    expect(isCelularValido("12")).toBe(false);
    expect(isEmailConArroba("a@b.com")).toBe(true);
    expect(isEmailConArroba("sinarroba")).toBe(false);
  });
});
