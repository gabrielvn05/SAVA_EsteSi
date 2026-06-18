import { describe, expect, it } from "vitest";
import { buildSolicitudTimeline } from "@/lib/solicitud-timeline";

describe("buildSolicitudTimeline", () => {
  it("incluye solicitud creada", () => {
    const events = buildSolicitudTimeline({
      estado: "en_revision_secretaria",
      created_at: "2026-06-01T10:00:00.000Z"
    });
    expect(events[0].label).toBe("Solicitar trámite");
    expect(events[0].status).toBe("completed");
    expect(events).toHaveLength(4);
  });

  it("marca fase decano como actual", () => {
    const events = buildSolicitudTimeline({
      estado: "pendiente_aprobacion_decano",
      created_at: "2026-06-01T10:00:00.000Z",
      updated_at: "2026-06-03T10:00:00.000Z",
      revisado_por: "uuid-secretaria"
    });
    expect(events[2].status).toBe("current");
  });
});
