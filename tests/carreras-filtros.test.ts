import { describe, expect, it } from "vitest";
import { isCarreraValida, labelCarrera } from "@/lib/carreras";
import { rowMatchesSolicitudFilters, type SolicitudListRow } from "@/lib/solicitudes-filters";

describe("carreras", () => {
  it("valida y etiqueta carreras", () => {
    expect(isCarreraValida("software")).toBe(true);
    expect(isCarreraValida("otra")).toBe(false);
    expect(labelCarrera("agroindustria")).toBe("AGROINDUSTRIA");
  });
});

describe("filtro por carrera", () => {
  const row: SolicitudListRow = {
    id: "1",
    creado_por: "u1",
    tipo: "viaje",
    estado: "aprobada",
    fecha_inicio: "2026-06-01",
    fecha_fin: "2026-06-02",
    motivo: "Viaje",
    justificativo_nombre: null,
    created_at: "2026-06-01",
    detalle: { carrera: "software" },
    profiles: null
  };

  it("filtra por carrera seleccionada", () => {
    expect(
      rowMatchesSolicitudFilters(row, {
        nombre: "",
        rol: "",
        carrera: "software",
        fechaDesde: "",
        fechaHasta: "",
        estado: ""
      })
    ).toBe(true);
    expect(
      rowMatchesSolicitudFilters(row, {
        nombre: "",
        rol: "",
        carrera: "biologia",
        fechaDesde: "",
        fechaHasta: "",
        estado: ""
      })
    ).toBe(false);
  });
});
