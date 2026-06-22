"use client";

import { useEffect, useState } from "react";

type Props = Readonly<{
  solicitudId?: string;
  justificativoUrl: string | null;
  justificativoNombre: string | null;
  nombreDescarga: string;
  initialHtml?: string | null;
}>;

export function OficioPreviewLazy({
  solicitudId,
  justificativoUrl,
  justificativoNombre,
  nombreDescarga,
  initialHtml = null
}: Props) {
  const [html, setHtml] = useState<string | null>(initialHtml);
  const [loading, setLoading] = useState(Boolean(justificativoUrl && !initialHtml && solicitudId));

  useEffect(() => {
    if (initialHtml || !justificativoUrl || !solicitudId) return;

    let cancelled = false;
    setLoading(true);
    fetch(`/api/solicitudes/${solicitudId}/preview-oficio`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("preview");
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setHtml(text);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialHtml, justificativoUrl, solicitudId]);

  if (!justificativoUrl) return null;

  return (
    <div className="solicitud-preview__adjunto stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Oficio institucional</h3>
        <a href={justificativoUrl} download={nombreDescarga} className="btn btn--secondary btn--sm">
          Descargar {nombreDescarga}
        </a>
      </div>
      <p className="field-hint" style={{ margin: 0 }}>
        {justificativoNombre ?? nombreDescarga}
      </p>
      {loading ? (
        <div className="inline-loading" role="status">
          <span className="inline-loading__spinner" aria-hidden />
          <span>Cargando vista previa del oficio…</span>
        </div>
      ) : html ? (
        <iframe title="Vista previa del oficio institucional" srcDoc={html} className="solicitud-preview__iframe" />
      ) : (
        <p className="field-hint">Use el botón de descarga para ver el oficio.</p>
      )}
    </div>
  );
}
