import { fetchDecanoOficioDestinatario } from "@/lib/certificado/fetch-decano-oficio";
import { renderOficioHtml } from "@/lib/certificado/render-oficio-html";
import { resolveSolicitanteCertificado } from "@/lib/certificado/resolve-solicitante";
import { parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";

const TIPOS_OFICIO: CertificadoTipo[] = ["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"];

export async function generarPreviewOficioHtml(input: {
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  detalle: Record<string, unknown> | null;
  creado_por: string;
  nombres: string;
  apellidos: string;
}): Promise<string | null> {
  if (!TIPOS_OFICIO.includes(input.tipo as CertificadoTipo)) return null;

  const detalle = input.detalle ?? {};
  const solicitante = await resolveSolicitanteCertificado(input.creado_por, undefined, {});
  const tipoPersonal = parseTipoPersonal(detalle.tipo_personal);
  const destinatario = await fetchDecanoOficioDestinatario();

  return renderOficioHtml(
    {
      solicitante: {
        nombres: input.nombres || solicitante.nombres,
        apellidos: input.apellidos || solicitante.apellidos,
        email: solicitante.email
      },
      tipo: input.tipo as CertificadoTipo,
      tipo_personal: tipoPersonal,
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin,
      motivo: input.motivo,
      detalle
    },
    destinatario
  );
}
