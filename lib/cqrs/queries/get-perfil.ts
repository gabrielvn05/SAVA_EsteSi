import type { QueryHandler } from "@/lib/cqrs/types";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolverPerfilInstitucional } from "@/lib/perfil-institucional";

export type PerfilCertificadoData = {
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  email: string;
  tipo_personal: string;
  cedula: string;
  carrera: string;
  jornada: string;
};

export const getPerfilQuery: QueryHandler<void, PerfilCertificadoData> = {
  name: "GetPerfilCertificado",
  async execute() {
    const supabase = createSupabaseRouteHandlerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "No autenticado." };

    const md = (user.user_metadata ?? {}) as Record<string, unknown>;
    const p = await resolveSolicitanteCertificado(user.id, user.email, md);
    const nombreCompleto = `${p.nombres} ${p.apellidos}`.trim();

    let institucional = resolverPerfilInstitucional({ rol: "docente" });
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("rol, cedula, carrera, jornada, celular")
        .eq("id", user.id)
        .single();
      if (data) {
        institucional = resolverPerfilInstitucional(data);
      }
    } catch {
      // usar valores por defecto
    }

    return {
      ok: true,
      data: {
        nombres: p.nombres,
        apellidos: p.apellidos,
        nombre_completo: nombreCompleto,
        email: p.email ?? "",
        tipo_personal: institucional.tipo_personal,
        cedula: institucional.cedula,
        carrera: institucional.carrera,
        jornada: institucional.jornada
      }
    };
  }
};
