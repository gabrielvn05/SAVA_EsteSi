import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";
import { fetchDecanoOficioDestinatario } from "@/lib/certificado/fetch-decano-oficio";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import { buildOficioPreviewPdf } from "@/lib/certificado/docx-buffer-to-preview-pdf";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  detalleInstitucionalDesdePerfil,
  perfilInstitucionalCompleto,
  resolverPerfilInstitucional
} from "@/lib/perfil-institucional";

export const runtime = "nodejs";

const TIPOS: CertificadoTipo[] = ["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"];

function isTipo(v: unknown): v is CertificadoTipo {
  return typeof v === "string" && (TIPOS as string[]).includes(v);
}

/** Vista previa PDF del oficio (mismo contenido que el Word descargable). */
export async function POST(req: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = (await req.json()) as {
    tipo?: unknown;
    fecha_inicio?: unknown;
    fecha_fin?: unknown;
    motivo?: unknown;
    detalle?: unknown;
  };

  if (!isTipo(body.tipo)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });

  const fecha_inicio = typeof body.fecha_inicio === "string" ? body.fecha_inicio : "";
  const fecha_fin = typeof body.fecha_fin === "string" ? body.fecha_fin : "";
  const motivo = typeof body.motivo === "string" ? body.motivo : "";
  let detalle =
    body.detalle && typeof body.detalle === "object" && body.detalle !== null
      ? (body.detalle as Record<string, unknown>)
      : {};

  const fechaIniErr = validateFechaInicioMaxTresMeses(fecha_inicio);
  if (fechaIniErr) return NextResponse.json({ error: fechaIniErr }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("rol, cedula, carrera, jornada, celular, nombres, apellidos")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 400 });

  const institucional = resolverPerfilInstitucional(profile);
  if (!perfilInstitucionalCompleto(institucional)) {
    return NextResponse.json(
      { error: "Tu perfil no tiene cédula o carrera registradas. Contacta a Secretaría." },
      { status: 400 }
    );
  }

  detalle = { ...detalle, ...detalleInstitucionalDesdePerfil(institucional) };

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const solicitante = await resolveSolicitanteCertificado(user.id, user.email, md);
  const tipoPersonal = parseTipoPersonal(detalle.tipo_personal);
  const destinatario = await fetchDecanoOficioDestinatario();

  try {
    const pdf = await buildOficioPreviewPdf(
      {
        solicitante: {
          nombres: profile.nombres ?? solicitante.nombres,
          apellidos: profile.apellidos ?? solicitante.apellidos,
          email: solicitante.email
        },
        tipo: body.tipo,
        tipo_personal: tipoPersonal,
        fecha_inicio,
        fecha_fin,
        motivo,
        detalle
      },
      destinatario
    );

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo generar la vista previa PDF.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
