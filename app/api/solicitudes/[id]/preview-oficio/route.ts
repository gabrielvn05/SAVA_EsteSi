import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, requireAuth } from "@/lib/auth";
import { fetchDecanoOficioDestinatario } from "@/lib/certificado/fetch-decano-oficio";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";
import { fetchSolicitudParaUsuario } from "@/lib/solicitud-access";
import { buildOficioPreviewPdf, docxBufferToPreviewPdf } from "@/lib/certificado/docx-buffer-to-preview-pdf";

export const runtime = "nodejs";

const TIPOS: CertificadoTipo[] = ["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"];

function isTipo(v: string): v is CertificadoTipo {
  return (TIPOS as string[]).includes(v);
}

/** Vista previa PDF del oficio guardado (desde el DOCX almacenado). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esStaff =
    profile.rol === "secretaria" || profile.rol === "decano" || profile.rol === "superusuario";

  const data = await fetchSolicitudParaUsuario(
    params.id,
    user.id,
    esStaff,
    "id, tipo, fecha_inicio, fecha_fin, motivo, detalle, creado_por, justificativo_path, profiles:creado_por(nombres, apellidos)"
  );

  if (!data || !isTipo(data.tipo)) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }

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

  const detalle =
    data.detalle && typeof data.detalle === "object" && !Array.isArray(data.detalle)
      ? (data.detalle as Record<string, unknown>)
      : {};

  const admin = createSupabaseAdminClient();
  let pdf: Buffer | null = null;

  if (data.justificativo_path) {
    const { data: archivo, error: dlErr } = await admin.storage
      .from("justificativos")
      .download(data.justificativo_path);
    if (!dlErr && archivo) {
      const docx = Buffer.from(await archivo.arrayBuffer());
      pdf = await docxBufferToPreviewPdf(docx);
    }
  }

  if (!pdf) {
    const solicitante = await resolveSolicitanteCertificado(data.creado_por, undefined, {});
    const tipoPersonal = parseTipoPersonal(detalle.tipo_personal);
    const destinatario = await fetchDecanoOficioDestinatario();
    try {
      pdf = await buildOficioPreviewPdf(
        {
          solicitante: {
            nombres: profiles?.nombres ?? solicitante.nombres,
            apellidos: profiles?.apellidos ?? solicitante.apellidos,
            email: solicitante.email
          },
          tipo: data.tipo,
          tipo_personal: tipoPersonal,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          motivo: data.motivo,
          detalle
        },
        destinatario
      );
    } catch {
      return NextResponse.json({ error: "No se pudo generar la vista previa PDF." }, { status: 500 });
    }
  }

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store"
    }
  });
}
