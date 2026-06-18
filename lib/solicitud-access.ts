import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Lee una solicitud con cliente admin y valida que el usuario pueda verla. */
export async function fetchSolicitudParaUsuario<T extends string>(
  id: string,
  userId: string,
  esStaff: boolean,
  select: T
) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("solicitudes").select(select).eq("id", id).maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  if (!esStaff && row.creado_por !== userId) return null;

  return data;
}
