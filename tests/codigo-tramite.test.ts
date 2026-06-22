import { describe, expect, it } from "vitest";
import {
  buildCodigoTramite,
  codigoTipoJustificacion,
  formatFechaCodigoTramite,
  inicialesSolicitante,
  nombreArchivoOficio,
  resolverCodigoTramite
} from "@/lib/codigo-tramite";
import { buildSolicitudTimeline } from "@/lib/solicitud-timeline";

describe("codigo-tramite", () => {
  it("genera FCVT-VJ-GAVN-17062026", () => {
    const codigo = buildCodigoTramite(
      "viaje",
      "GABRIEL ALEXANDER",
      "VELEZ NUÑEZ",
      "2026-06-17T18:26:00.000Z"
    );
    expect(codigo).toBe("FCVT-VJ-GAVN-17062026");
    expect(nombreArchivoOficio(codigo)).toBe("FCVT-VJ-GAVN-17062026.docx");
  });

  it("mapea tipos de justificación", () => {
    expect(codigoTipoJustificacion("enfermedad")).toBe("CM");
    expect(codigoTipoJustificacion("calamidad_domestica")).toBe("CD");
    expect(codigoTipoJustificacion("falta_marcado")).toBe("RM");
  });

  it("calcula iniciales del solicitante", () => {
    expect(inicialesSolicitante("Gabriel Alexander", "Velez Nuñez")).toBe("GAVN");
  });

  it("usa código guardado en detalle", () => {
    const codigo = resolverCodigoTramite({
      tipo: "viaje",
      created_at: "2026-06-17T18:26:00.000Z",
      detalle: { codigo_tramite: "FCVT-VJ-GAVN-17062026" },
      nombres: "A",
      apellidos: "B"
    });
    expect(codigo).toBe("FCVT-VJ-GAVN-17062026");
  });

  it("formatea fecha DDMMYYYY", () => {
    expect(formatFechaCodigoTramite("2026-06-17T12:00:00.000Z")).toBe("17062026");
  });
});

describe("buildSolicitudTimeline fases completas", () => {
  it("muestra las cuatro fases en revisión secretaría", () => {
    const events = buildSolicitudTimeline({
      estado: "en_revision_secretaria",
      created_at: "2026-06-01T10:00:00.000Z"
    });
    expect(events).toHaveLength(4);
    expect(events[1].status).toBe("current");
    expect(events[2].status).toBe("pending");
    expect(events[3].status).toBe("pending");
  });

  it("marca rechazo en secretaría", () => {
    const events = buildSolicitudTimeline({
      estado: "rechazada",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-02T10:00:00.000Z",
      revisado_por: "uuid-secretaria"
    });
    expect(events[1].status).toBe("rejected");
    expect(events[3].label).toBe("Trámite rechazado");
  });

  it("marca aprobación final", () => {
    const events = buildSolicitudTimeline({
      estado: "aprobada",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-02T10:00:00.000Z",
      fecha_firma: "2026-06-02T10:00:00.000Z",
      revisado_por: "uuid-secretaria",
      firmado_por: "uuid-decano"
    });
    expect(events[3].label).toBe("Trámite aprobado");
    expect(events[3].status).toBe("completed");
  });
});
