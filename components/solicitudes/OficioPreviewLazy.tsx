"use client";

import { DocumentViewer } from "@/components/ui/DocumentViewer";

type Props = Readonly<{
  solicitudId?: string;
  justificativoUrl: string | null;
  justificativoNombre: string | null;
  nombreDescarga: string;
}>;

export function OficioPreviewLazy({
  solicitudId,
  justificativoUrl,
  justificativoNombre,
  nombreDescarga
}: Props) {
  if (!justificativoUrl || !solicitudId) return null;

  const previewUrl = `/api/solicitudes/${solicitudId}/preview-oficio`;
  const pdfName = nombreDescarga.replace(/\.docx$/i, ".pdf");

  return (
    <div className="stack" style={{ gap: "0.5rem" }}>
      <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Oficio institucional</h3>
      <p className="field-hint" style={{ margin: 0 }}>
        {justificativoNombre ?? nombreDescarga} — vista previa PDF del mismo contenido del Word.
      </p>
      <DocumentViewer
        title="Oficio institucional"
        fileName={pdfName}
        src={previewUrl}
        downloadHref={justificativoUrl}
      />
    </div>
  );
}
