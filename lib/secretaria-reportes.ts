import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";

export function normalizeSolicitudListRow(raw: Record<string, unknown>): SolicitudListRow {
  let profiles = raw.profiles as SolicitudListRow["profiles"] | SolicitudListRow["profiles"][] | null | undefined;
  if (Array.isArray(profiles)) profiles = profiles[0] ?? null;
  const detalle = raw.detalle;
  return {
    id: String(raw.id),
    creado_por: String(raw.creado_por ?? ""),
    tipo: String(raw.tipo),
    estado: String(raw.estado),
    fecha_inicio: String(raw.fecha_inicio),
    fecha_fin: String(raw.fecha_fin),
    motivo: String(raw.motivo),
    justificativo_nombre: raw.justificativo_nombre != null ? String(raw.justificativo_nombre) : null,
    created_at: String(raw.created_at),
    detalle: detalle && typeof detalle === "object" && !Array.isArray(detalle) ? (detalle as Record<string, unknown>) : null,
    profiles: profiles ?? null
  };
}

export async function loadSolicitudesParaReporte(): Promise<{ rows: SolicitudListRow[]; error: string | null }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("solicitudes")
    .select(
      "id, creado_por, tipo, estado, fecha_inicio, fecha_fin, motivo, justificativo_nombre, created_at, detalle, profiles!solicitudes_creado_por_fkey(nombres, apellidos, email, rol)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], error: error.message };
  }

  return {
    rows: (data || []).map((r) => normalizeSolicitudListRow(r as unknown as Record<string, unknown>)),
    error: null
  };
}
