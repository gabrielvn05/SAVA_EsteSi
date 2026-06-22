type SolicitudObservaciones = Readonly<{
  estado: string;
  observaciones_secretaria: string | null;
  observaciones_decano: string | null;
  firmado_por: string | null;
}>;

/** Muestra solo la observación del rol que rechazó el trámite. */
export function observacionRechazoVisible(
  solicitud: SolicitudObservaciones
): Readonly<{ label: string; texto: string }> | null {
  if (solicitud.estado !== "rechazada") return null;

  if (solicitud.firmado_por && solicitud.observaciones_decano?.trim()) {
    return { label: "Rechazada por Decano", texto: solicitud.observaciones_decano.trim() };
  }

  if (solicitud.observaciones_secretaria?.trim()) {
    return { label: "Rechazada por Secretaría", texto: solicitud.observaciones_secretaria.trim() };
  }

  if (solicitud.observaciones_decano?.trim()) {
    return { label: "Rechazada por Decano", texto: solicitud.observaciones_decano.trim() };
  }

  return null;
}
