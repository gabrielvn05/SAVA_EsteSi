import { describe, expect, it } from "vitest";
import { validateFechaInicioMaxTresMeses, isoDateUTC, threeMonthsAgoUTC } from "@/lib/fechas";

describe("validateFechaInicioMaxTresMeses", () => {
  it("rechaza fechas inválidas", () => {
    expect(validateFechaInicioMaxTresMeses("2026-13-01")).toBe("Fecha inicio inválida.");
  });

  it("rechaza fechas mayores a 3 meses", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    const min = isoDateUTC(threeMonthsAgoUTC(now));
    const result = validateFechaInicioMaxTresMeses("2020-01-01", now);
    expect(result).toContain(min);
  });

  it("acepta fechas dentro del rango", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    expect(validateFechaInicioMaxTresMeses("2026-05-01", now)).toBeNull();
  });
});
