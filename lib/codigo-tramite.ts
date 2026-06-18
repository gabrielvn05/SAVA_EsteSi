/** Prefijo institucional del código de trámite / oficio. */
export const CODIGO_INSTITUCION = "FCVT";

const TIPO_CODIGO: Record<string, string> = {
  enfermedad: "CM",
  viaje: "VJ",
  calamidad_domestica: "CD",
  falta_marcado: "RM"
};

/** Código corto del tipo de justificación (CM, VJ, CD, RM). */
export function codigoTipoJustificacion(tipo: string): string {
  return TIPO_CODIGO[tipo] ?? "XX";
}

/** Iniciales del solicitante: primera letra de cada nombre y apellido. Ej. GAVN. */
export function inicialesSolicitante(nombres: string, apellidos: string): string {
  const partes = `${nombres} ${apellidos}`.trim().split(/\s+/).filter(Boolean);
  return partes.map((p) => (p[0] ?? "").toUpperCase()).join("");
}

/** Fecha de generación en formato DDMMYYYY. */
export function formatFechaCodigoTramite(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(d.getTime())) {
    const digits = String(fecha).replace(/\D/g, "");
    return digits.slice(-8) || "00000000";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
}

/**
 * Estructura: FCVT-{tipo}-{iniciales}-{fecha}
 * Ejemplo: FCVT-VJ-GAVN-17062026
 */
export function buildCodigoTramite(
  tipo: string,
  nombres: string,
  apellidos: string,
  fechaGeneracion: Date | string = new Date()
): string {
  return `${CODIGO_INSTITUCION}-${codigoTipoJustificacion(tipo)}-${inicialesSolicitante(nombres, apellidos)}-${formatFechaCodigoTramite(fechaGeneracion)}`;
}

export function nombreArchivoOficio(codigoTramite: string): string {
  return `${codigoTramite}.docx`;
}

/** Resuelve el código desde detalle guardado o lo reconstruye para solicitudes antiguas. */
export function resolverCodigoTramite(input: {
  tipo: string;
  created_at: string;
  detalle?: Record<string, unknown> | null;
  nombres?: string;
  apellidos?: string;
}): string {
  const guardado = input.detalle?.codigo_tramite;
  if (typeof guardado === "string" && guardado.trim()) return guardado.trim();
  if (input.nombres && input.apellidos) {
    return buildCodigoTramite(input.tipo, input.nombres, input.apellidos, input.created_at);
  }
  return `${CODIGO_INSTITUCION}-${codigoTipoJustificacion(input.tipo)}-XXXX-${formatFechaCodigoTramite(input.created_at)}`;
}
