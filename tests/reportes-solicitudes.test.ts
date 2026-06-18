import { describe, expect, it } from "vitest";
import { filtrarSolicitudesPorPeriodo, rangoPeriodoReporte } from "@/lib/reportes-solicitudes";

describe("reportes-solicitudes", () => {
  const ref = new Date("2026-06-10T12:00:00.000Z");
  const rows = [
    { created_at: "2026-06-09T10:00:00.000Z" },
    { created_at: "2026-05-01T10:00:00.000Z" },
    { created_at: "2025-12-01T10:00:00.000Z" }
  ];

  it("filtra reporte semanal", () => {
    const filtradas = filtrarSolicitudesPorPeriodo(rows, "semanal", ref);
    expect(filtradas).toHaveLength(1);
  });

  it("filtra reporte mensual", () => {
    const filtradas = filtrarSolicitudesPorPeriodo(rows, "mensual", ref);
    expect(filtradas).toHaveLength(1);
  });

  it("filtra reporte anual", () => {
    const filtradas = filtrarSolicitudesPorPeriodo(rows, "anual", ref);
    expect(filtradas).toHaveLength(2);
  });

  it("describe el periodo mensual", () => {
    const meta = rangoPeriodoReporte("mensual", ref);
    expect(meta.label).toContain("Reporte mensual");
  });
});
