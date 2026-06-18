import type { CertificadoTipo } from "@/lib/certificado/build-certificado-pdf";

export const OFICIO_TEMPLATE_FILES: Record<CertificadoTipo, string> = {
  enfermedad: "oficio-medico.docx",
  viaje: "oficio-viaje.docx",
  calamidad_domestica: "oficio-calamidad.docx",
  falta_marcado: "oficio-reconocimiento-facial.docx"
};
