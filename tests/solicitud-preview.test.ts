import { describe, expect, it } from "vitest";
import { buildSolicitudPreviewFields, justificativoEsPdf } from "@/lib/solicitud-preview";

describe("buildSolicitudPreviewFields", () => {
  it("incluye campos de enfermedad", () => {
    const fields = buildSolicitudPreviewFields(
      "enfermedad",
      {
        tipo_personal: "docente",
        cedula: "123",
        diagnostico: "Gripe",
        institucion_medica: "IESS"
      },
      "Certificado médico: Gripe",
      "2026-06-02",
      "2026-06-05"
    );
    expect(fields.some((f) => f.label === "Diagnóstico" && f.value === "Gripe")).toBe(true);
  });
});

describe("justificativoEsPdf", () => {
  it("detecta PDF", () => {
    expect(justificativoEsPdf("certificado.pdf")).toBe(true);
    expect(justificativoEsPdf("foto.png")).toBe(false);
  });
});
