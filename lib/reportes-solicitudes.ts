import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import { labelEstado } from "@/lib/estados";
import { carreraFromSolicitud } from "@/lib/solicitudes-filters";

export type PeriodoReporte = "semanal" | "mensual" | "anual";

export type FilaReporte = Readonly<{
  tramite: string;
  solicitante: string;
  tipo: string;
  carrera: string;
  estado: string;
  periodo: string;
  motivo: string;
  fechaIngreso: string;
}>;

export function rangoPeriodoReporte(periodo: PeriodoReporte, ref = new Date()): { desde: Date; hasta: Date; label: string } {
  const hasta = new Date(ref);
  hasta.setHours(23, 59, 59, 999);

  if (periodo === "semanal") {
    const desde = new Date(ref);
    desde.setDate(desde.getDate() - 6);
    desde.setHours(0, 0, 0, 0);
    return { desde, hasta, label: "Reporte semanal (últimos 7 días)" };
  }

  if (periodo === "mensual") {
    const desde = new Date(ref.getFullYear(), ref.getMonth(), 1);
    desde.setHours(0, 0, 0, 0);
    const finMes = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    finMes.setHours(23, 59, 59, 999);
    return { desde, hasta: finMes, label: `Reporte mensual (${desde.toLocaleString("es", { month: "long", year: "numeric" })})` };
  }

  const desde = new Date(ref.getFullYear(), 0, 1);
  desde.setHours(0, 0, 0, 0);
  const finAnio = new Date(ref.getFullYear(), 11, 31);
  finAnio.setHours(23, 59, 59, 999);
  return { desde, hasta: finAnio, label: `Reporte anual (${ref.getFullYear()})` };
}

export function filtrarSolicitudesPorPeriodo<T extends { created_at: string }>(
  rows: T[],
  periodo: PeriodoReporte,
  ref = new Date()
): T[] {
  const { desde, hasta } = rangoPeriodoReporte(periodo, ref);
  return rows.filter((r) => {
    const d = new Date(r.created_at);
    return !Number.isNaN(d.getTime()) && d >= desde && d <= hasta;
  });
}

export function mapFilaReporte(row: {
  id: string;
  tipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  created_at: string;
  detalle?: Record<string, unknown> | null;
  profiles?: { nombres: string; apellidos: string } | null;
}): FilaReporte {
  const solicitante = row.profiles
    ? `${row.profiles.nombres} ${row.profiles.apellidos}`.trim()
    : "—";
  const listRow = {
    id: row.id,
    creado_por: "",
    tipo: row.tipo,
    estado: row.estado,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    motivo: row.motivo,
    justificativo_nombre: null,
    created_at: row.created_at,
    detalle: row.detalle ?? null,
    profiles: row.profiles ?? null
  };
  return {
    tramite: row.id.slice(0, 8).toUpperCase(),
    solicitante,
    tipo: labelTipoSolicitud(row.tipo),
    carrera: carreraFromSolicitud(listRow) || "—",
    estado: labelEstado(row.estado),
    periodo: `${row.fecha_inicio} — ${row.fecha_fin}`,
    motivo: row.motivo,
    fechaIngreso: row.created_at
  };
}

export function filasReporteACsv(filas: FilaReporte[], pie?: string): string {
  const header = ["Trámite", "Solicitante", "Tipo", "Carrera", "Estado", "Periodo", "Motivo", "Fecha ingreso"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(",")];
  for (const f of filas) {
    lines.push(
      [f.tramite, f.solicitante, f.tipo, f.carrera, f.estado, f.periodo, f.motivo, f.fechaIngreso].map(escape).join(",")
    );
  }
  if (pie?.trim()) {
    lines.push("");
    lines.push(escape(pie));
  }
  return lines.join("\n");
}
