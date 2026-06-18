import type { SolicitudListRow } from "@/lib/solicitudes-filters";
import { nombreSolicitante } from "@/lib/solicitudes-filters";
import { filtrarSolicitudesPorPeriodo, type PeriodoReporte } from "@/lib/reportes-solicitudes";

export type FiltroTipoReporte = "" | "enfermedad" | "viaje" | "calamidad_domestica" | "falta_marcado";

export type FiltrosReporte = Readonly<{
  periodo: PeriodoReporte;
  tipo: FiltroTipoReporte;
  carrera: string;
  usuario: string;
  fechaDesde: string;
  fechaHasta: string;
}>;

function enRangoFechas(createdAt: string, desde: string, hasta: string): boolean {
  if (!desde && !hasta) return true;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;
  if (desde) {
    const a = new Date(`${desde}T00:00:00`);
    if (d < a) return false;
  }
  if (hasta) {
    const b = new Date(`${hasta}T23:59:59`);
    if (d > b) return false;
  }
  return true;
}

export function filtrarSolicitudesReporte(rows: SolicitudListRow[], f: FiltrosReporte): SolicitudListRow[] {
  let out = filtrarSolicitudesPorPeriodo(rows, f.periodo);

  if (f.fechaDesde || f.fechaHasta) {
    out = out.filter((r) => enRangoFechas(r.created_at, f.fechaDesde, f.fechaHasta));
  }

  if (f.tipo) {
    out = out.filter((r) => r.tipo === f.tipo);
  }

  if (f.carrera) {
    out = out.filter((r) => {
      const valor = r.detalle && typeof r.detalle.carrera === "string" ? r.detalle.carrera : "";
      return valor === f.carrera;
    });
  }

  const q = f.usuario.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => {
      const nombre = nombreSolicitante(r).toLowerCase();
      const motivo = (r.motivo ?? "").toLowerCase();
      return nombre.includes(q) || motivo.includes(q);
    });
  }

  return out;
}

export function formatPieReporte(generador: string, fecha = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const cuando = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
  return `Generado por: ${generador.trim() || "—"} · ${cuando}`;
}
