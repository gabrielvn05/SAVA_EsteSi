function str(v: unknown) {
  return v != null && String(v).trim() ? String(v).trim() : "";
}

export function labelTipoViajeEvento(value: unknown): string {
  switch (str(value)) {
    case "estudio":
      return "Estudio";
    case "congreso_expositor":
      return "Congreso – Expositor";
    case "congreso_participante":
      return "Congreso – Participante (observador)";
    default:
      return str(value) || "—";
  }
}

export function labelTipoCalamidad(value: unknown): string {
  switch (str(value)) {
    case "fallecimiento_familiar":
      return "Fallecimiento de familiar";
    case "emergencia_medica_familiar":
      return "Emergencia médica grave de familiar";
    default:
      return str(value) || "—";
  }
}

export function labelParentesco(value: unknown): string {
  switch (str(value)) {
    case "conyuge":
      return "Cónyuge";
    case "madre":
      return "Madre";
    case "padre":
      return "Padre";
    case "hermano":
      return "Hermano(a)";
    case "hijo":
      return "Hijo(a)";
    default:
      return str(value) || "—";
  }
}

export function labelTipoMarcacionOmitida(value: unknown): string {
  switch (str(value)) {
    case "entrada":
      return "Marcación de entrada";
    case "salida":
      return "Marcación de salida";
    case "ambas":
      return "Ambas (entrada y salida)";
    default:
      return str(value) || "—";
  }
}

export function labelMotivoFaltaRegistro(value: unknown): string {
  switch (str(value)) {
    case "olvido_docente":
      return "Olvido del docente";
    case "falla_face_id":
      return "Falla técnica del sistema Face ID";
    default:
      return str(value) || "—";
  }
}

export function formatFechaOficio(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatRangoFechas(desde: unknown, hasta: unknown): string {
  const a = formatFechaOficio(str(desde));
  const b = formatFechaOficio(str(hasta));
  if (a === "—" && b === "—") return "—";
  if (b === "—" || a === b) return a;
  return `desde ${a} hasta ${b}`;
}
