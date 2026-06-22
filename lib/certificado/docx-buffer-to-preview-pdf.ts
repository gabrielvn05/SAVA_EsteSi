import { convertDocxToPdf } from "@/lib/certificado/convert-docx-to-pdf";
import { buildCertificadoPdf, type BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import type { OficioDestinatario } from "@/lib/certificado/oficio-placeholders";

/** Convierte el DOCX almacenado/generado al mismo PDF que vería el usuario al imprimir. */
export async function docxBufferToPreviewPdf(docx: Buffer): Promise<Buffer | null> {
  if (!docx.length) return null;
  return convertDocxToPdf(docx);
}

/** Genera PDF de vista previa a partir de los mismos datos del oficio Word. */
export async function buildOficioPreviewPdf(
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario
): Promise<Buffer> {
  const { buffer } = await buildCertificadoPdf(input, destinatario);
  return buffer;
}
