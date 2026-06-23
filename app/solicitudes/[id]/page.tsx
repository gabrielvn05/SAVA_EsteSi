import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, hasCapability, requireAuth } from "@/lib/auth";
import { SolicitudDetallePanel } from "@/components/solicitudes/SolicitudDetallePanel";
import { fetchSolicitudParaUsuario } from "@/lib/solicitud-access";
import { anexosDesdeDetalle } from "@/lib/solicitud-anexos";
import { codigoTramiteDesdeSolicitud } from "@/lib/solicitud-timeline";

type Params = { id: string };

export default async function SolicitudDetallePage({ params }: Readonly<{ params: Params }>) {
  const { id } = params;
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esStaff =
    profile.rol === "secretaria" || profile.rol === "decano" || profile.rol === "superusuario";

  const data = await fetchSolicitudParaUsuario(
    id,
    user.id,
    esStaff,
    "id, tipo, estado, fecha_inicio, fecha_fin, motivo, detalle, observaciones_secretaria, observaciones_decano, justificativo_path, justificativo_nombre, created_at, updated_at, fecha_firma, creado_por, revisado_por, firmado_por, profiles:creado_por(nombres, apellidos)"
  );

  if (!data) {
    return (
      <section className="card">
        <p>Solicitud no encontrada.</p>
      </section>
    );
  }

  const [puedeRevisar, puedeAprobar] = await Promise.all([
    hasCapability(user.id, "revisar_solicitudes"),
    hasCapability(user.id, "aprobar_solicitudes")
  ]);

  let profiles = data.profiles as { nombres: string; apellidos: string } | { nombres: string; apellidos: string }[] | null;
  if (Array.isArray(profiles)) profiles = profiles[0] ?? null;

  if (!profiles) {
    const admin = createSupabaseAdminClient();
    const { data: perfilCreador } = await admin
      .from("profiles")
      .select("nombres, apellidos")
      .eq("id", data.creado_por)
      .maybeSingle();
    profiles = perfilCreador ?? null;
  }

  const solicitanteNombre = profiles ? `${profiles.nombres} ${profiles.apellidos}`.trim() : "—";

  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasJustificativo = Boolean(data.justificativo_path && data.justificativo_nombre);
  const justificativoUrl = hasJustificativo
    ? `${supabaseBase}/storage/v1/object/public/justificativos/${data.justificativo_path}`
    : null;

  const detalleObj = (data.detalle as Record<string, unknown>) ?? null;
  const anexosResueltos = anexosDesdeDetalle(detalleObj, supabaseBase ?? "");
  const anexoPath = anexosResueltos[0]?.path ?? null;
  const anexoNombre = anexosResueltos[0]?.nombre ?? null;
  const anexoUrl = anexosResueltos[0]?.url ?? null;

  const codigoTramite = codigoTramiteDesdeSolicitud({
    tipo: data.tipo,
    created_at: data.created_at,
    detalle: detalleObj,
    nombres: profiles?.nombres ?? "",
    apellidos: profiles?.apellidos ?? ""
  });

  const oficioPreviewHtml = null;

  return (
    <SolicitudDetallePanel
      solicitud={{
        id: data.id,
        tipo: data.tipo,
        estado: data.estado,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        motivo: data.motivo,
        detalle: detalleObj,
        observaciones_secretaria: data.observaciones_secretaria,
        observaciones_decano: data.observaciones_decano,
        justificativo_path: data.justificativo_path,
        justificativo_nombre: data.justificativo_nombre,
        justificativo_url: justificativoUrl,
        anexo_nombre: anexoNombre,
        anexo_url: anexoUrl,
        anexos: anexosResueltos.map((a) => ({ path: a.path, nombre: a.nombre, url: a.url })),
        created_at: data.created_at,
        updated_at: data.updated_at,
        fecha_firma: data.fecha_firma,
        creado_por: data.creado_por,
        revisado_por: data.revisado_por,
        firmado_por: data.firmado_por,
        solicitante_nombre: solicitanteNombre,
        codigo_tramite: codigoTramite,
        oficio_preview_html: oficioPreviewHtml,
        solicitud_id: data.id
      }}
      userId={user.id}
      puedeRevisar={puedeRevisar}
      puedeAprobar={puedeAprobar}
      esStaff={esStaff}
      esCreador={data.creado_por === user.id}
    />
  );
}
