import type { CommandHandler } from "@/lib/cqrs/types";
import { validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/logging/logger";

export type CrearSolicitudInput = {
  userId: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  justificativoPath: string | null;
  justificativoNombre: string | null;
};

export const crearSolicitudCommand: CommandHandler<CrearSolicitudInput, { id: string }> = {
  name: "CrearSolicitud",
  async execute(input) {
    const fechaError = validateFechaInicioMaxTresMeses(input.fechaInicio);
    if (fechaError) return { ok: false, error: fechaError };

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("solicitudes")
      .insert({
        creado_por: input.userId,
        tipo: input.tipo,
        fecha_inicio: input.fechaInicio,
        fecha_fin: input.fechaFin,
        motivo: input.motivo,
        justificativo_path: input.justificativoPath,
        justificativo_nombre: input.justificativoNombre,
        estado: "en_revision_secretaria"
      })
      .select("id")
      .single();

    if (error) {
      logEvent("db", "error", error.message, { command: "CrearSolicitud" });
      return { ok: false, error: error.message };
    }

    logEvent("audit", "info", "Solicitud creada", { solicitudId: data.id, userId: input.userId });
    return { ok: true, data: { id: data.id } };
  }
};
