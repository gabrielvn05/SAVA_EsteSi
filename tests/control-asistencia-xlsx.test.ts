import { describe, expect, it } from "vitest";
import { horasPorJornada, mapFilaControlAsistencia } from "@/lib/reportes/control-asistencia-xlsx";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";

describe("horasPorJornada", () => {
  it("muestra entrada y salida en primera jornada", () => {
    const h = horasPorJornada("primera_jornada", "08:00", "17:00");
    expect(h.entradaJ1).toBe("08:00");
    expect(h.salidaJ1).toBe("17:00");
  });

  it("muestra ambas horas aunque el inconveniente sea solo entrada", () => {
    const row: SolicitudListRow = {
      id: "abc",
      creado_por: "u1",
      tipo: "falta_marcado",
      estado: "aprobada",
      fecha_inicio: "2026-06-17",
      fecha_fin: "2026-06-17",
      motivo: "Marcación",
      justificativo_nombre: null,
      created_at: "2026-06-17T10:00:00.000Z",
      detalle: {
        cedula: "1315591303",
        carrera: "SOFTWARE",
        jornada: "primera_jornada",
        tipo_marcacion_omitida: "entrada",
        hora_real_ingreso: "08:00",
        hora_real_salida: "17:00",
        fecha_incidente: "2026-06-17"
      },
      profiles: { nombres: "Gabriel", apellidos: "Velez" }
    };

    const f = mapFilaControlAsistencia(row);
    expect(f.entradaJ1).toBe("08:00");
    expect(f.salidaJ1).toBe("17:00");
  });
});
