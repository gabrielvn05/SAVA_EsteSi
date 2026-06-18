import { NextResponse } from "next/server";
import { getUserProfile, requireAuth } from "@/lib/auth";
import {
  buildControlAsistenciaXlsx,
  mapFilaControlAsistencia,
  nombreArchivoControlAsistencia
} from "@/lib/reportes/control-asistencia-xlsx";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";

export const runtime = "nodejs";

type Body = {
  rows?: unknown;
  generadoPor?: unknown;
};

function normalizeRow(raw: unknown): SolicitudListRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.tipo !== "string" || typeof r.created_at !== "string") return null;

  let profiles = r.profiles as SolicitudListRow["profiles"] | SolicitudListRow["profiles"][] | null | undefined;
  if (Array.isArray(profiles)) profiles = profiles[0] ?? null;

  const detalle = r.detalle;
  return {
    id: r.id,
    creado_por: String(r.creado_por ?? ""),
    tipo: r.tipo,
    estado: String(r.estado ?? ""),
    fecha_inicio: String(r.fecha_inicio ?? ""),
    fecha_fin: String(r.fecha_fin ?? ""),
    motivo: String(r.motivo ?? ""),
    justificativo_nombre: r.justificativo_nombre != null ? String(r.justificativo_nombre) : null,
    created_at: r.created_at,
    detalle: detalle && typeof detalle === "object" && !Array.isArray(detalle) ? (detalle as Record<string, unknown>) : null,
    profiles: profiles ?? null
  };
}

/** Genera el Excel de control de asistencia ULEAM para reportes de marcación. */
export async function POST(req: Request) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol !== "secretaria" && profile.rol !== "decano" && profile.rol !== "superusuario") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = (await req.json()) as Body;
  const rawRows = Array.isArray(body.rows) ? body.rows : [];
  const rows = rawRows.map(normalizeRow).filter((r): r is SolicitudListRow => r !== null && r.tipo === "falta_marcado");

  if (rows.length === 0) {
    return NextResponse.json({ error: "No hay solicitudes de marcación para el reporte." }, { status: 400 });
  }

  const generadoPor =
    typeof body.generadoPor === "string" && body.generadoPor.trim()
      ? body.generadoPor.trim()
      : `${profile.nombres} ${profile.apellidos}`.trim();

  const filas = rows.map(mapFilaControlAsistencia);
  const buffer = await buildControlAsistenciaXlsx(filas, { generadoPor });
  const nombre = nombreArchivoControlAsistencia();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`
    }
  });
}
