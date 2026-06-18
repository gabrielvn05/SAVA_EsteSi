import { resolverCodigoTramite } from "@/lib/codigo-tramite";

export type TimelineEventStatus = "completed" | "current" | "pending" | "rejected";

export type TimelineEvent = Readonly<{
  id: string;
  label: string;
  fecha: string | null;
  status: TimelineEventStatus;
}>;

export type SolicitudTimelineInput = Readonly<{
  estado: string;
  created_at: string;
  updated_at?: string | null;
  fecha_firma?: string | null;
  revisado_por?: string | null;
  firmado_por?: string | null;
}>;

function formatFecha(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString();
}

/** Construye las cuatro fases del trámite; la fase actual queda marcada como `current`. */
export function buildSolicitudTimeline(s: SolicitudTimelineInput): TimelineEvent[] {
  const isRejected = s.estado === "rechazada";
  const rejectedAtSecretaria = isRejected && Boolean(s.revisado_por) && !s.firmado_por;
  const rejectedAtDecano = isRejected && Boolean(s.firmado_por);

  const secretariaStatus: TimelineEventStatus =
    s.estado === "en_revision_secretaria"
      ? "current"
      : rejectedAtSecretaria
        ? "rejected"
        : s.revisado_por || s.estado !== "en_revision_secretaria"
          ? "completed"
          : "pending";

  const decanoStatus: TimelineEventStatus = rejectedAtSecretaria
    ? "pending"
    : s.estado === "pendiente_aprobacion_decano"
      ? "current"
      : rejectedAtDecano
        ? "rejected"
        : s.estado === "aprobada" || rejectedAtDecano
          ? "completed"
          : secretariaStatus === "completed"
            ? "pending"
            : "pending";

  const finalLabel =
    s.estado === "aprobada" ? "Trámite aprobado" : isRejected ? "Trámite rechazado" : "Trámite finalizado";

  const finalStatus: TimelineEventStatus =
    s.estado === "aprobada" ? "completed" : isRejected ? "rejected" : "pending";

  return [
    {
      id: "creada",
      label: "Solicitar trámite",
      fecha: formatFecha(s.created_at),
      status: "completed"
    },
    {
      id: "revision_secretaria",
      label: "Revisión (Secretaría)",
      fecha:
        secretariaStatus === "completed" || secretariaStatus === "rejected"
          ? formatFecha(s.updated_at ?? s.created_at)
          : secretariaStatus === "current"
            ? formatFecha(s.created_at)
            : null,
      status: secretariaStatus
    },
    {
      id: "revision_decano",
      label: "Revisión (Decano)",
      fecha:
        decanoStatus === "completed" || decanoStatus === "rejected"
          ? formatFecha(s.fecha_firma ?? s.updated_at)
          : decanoStatus === "current"
            ? formatFecha(s.updated_at ?? s.created_at)
            : null,
      status: decanoStatus
    },
    {
      id: "final",
      label: finalLabel,
      fecha:
        finalStatus === "completed" || finalStatus === "rejected"
          ? formatFecha(s.fecha_firma ?? s.updated_at)
          : null,
      status: finalStatus
    }
  ];
}

/** @deprecated Use resolverCodigoTramite from lib/codigo-tramite */
export function numeroTramite(
  id: string,
  createdAt: string,
  extra?: {
    tipo?: string;
    detalle?: Record<string, unknown> | null;
    nombres?: string;
    apellidos?: string;
  }
): string {
  if (extra?.tipo && extra.nombres && extra.apellidos) {
    return resolverCodigoTramite({
      tipo: extra.tipo,
      created_at: createdAt,
      detalle: extra.detalle,
      nombres: extra.nombres,
      apellidos: extra.apellidos
    });
  }
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const suffix = Number.isNaN(d.getTime())
    ? createdAt.replace(/\D/g, "").slice(-8)
    : `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
  return `${id.slice(0, 5).toUpperCase()}-${suffix}`;
}

export { resolverCodigoTramite as codigoTramiteDesdeSolicitud };
