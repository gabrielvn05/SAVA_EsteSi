"use client";

import { useEffect, useMemo, useState } from "react";

type Props = Readonly<{
  title: string;
  fileName: string;
  /** URL del PDF (directa o API). */
  src: string;
  downloadHref: string;
  /** Si el src ya es un PDF público, evita fetch intermedio. */
  direct?: boolean;
  kind?: "pdf" | "image";
}>;

export function DocumentViewer({
  title,
  fileName,
  src,
  downloadHref,
  direct = false,
  kind = "pdf"
}: Props) {
  const [frameSrc, setFrameSrc] = useState<string | null>(direct && kind === "pdf" ? src : null);
  const [loading, setLoading] = useState(kind === "pdf" && !direct);
  const [error, setError] = useState<string | null>(null);

  const displayName = useMemo(() => fileName || title, [fileName, title]);

  useEffect(() => {
    if (kind !== "pdf" || direct) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setFrameSrc(null);

    fetch(src, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "No se pudo generar la vista previa.");
        }
        const blob = await r.blob();
        if (!blob.size) throw new Error("El documento de vista previa está vacío.");
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setFrameSrc(objectUrl);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "No se pudo cargar la vista previa.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, direct, kind]);

  function imprimir() {
    if (kind === "pdf" && frameSrc) {
      const w = window.open(frameSrc, "_blank", "noopener,noreferrer");
      w?.focus();
      return;
    }
    if (kind === "image") {
      const w = window.open(src, "_blank", "noopener,noreferrer");
      w?.focus();
    }
  }

  return (
    <div className="doc-viewer">
      <div className="doc-viewer__toolbar">
        <div className="doc-viewer__toolbar-left">
          <span className="doc-viewer__title">{displayName}</span>
        </div>
        <div className="doc-viewer__toolbar-right">
          <a href={downloadHref} download={fileName || undefined} className="doc-viewer__tool-btn" title="Descargar">
            ⬇
          </a>
          <button type="button" className="doc-viewer__tool-btn" title="Abrir / imprimir" onClick={imprimir}>
            🖨
          </button>
        </div>
      </div>

      <div className="doc-viewer__canvas">
        {loading ? (
          <div className="doc-viewer__status" role="status">
            <span className="inline-loading__spinner" aria-hidden />
            <span>Cargando documento…</span>
          </div>
        ) : null}

        {error ? (
          <div className="doc-viewer__status doc-viewer__status--error" role="alert">
            <p>{error}</p>
            <a href={downloadHref} download={fileName || undefined} className="btn btn--secondary btn--sm">
              Descargar archivo original
            </a>
          </div>
        ) : null}

        {!loading && !error && kind === "pdf" && frameSrc ? (
          <iframe title={title} src={`${frameSrc}#view=FitH&toolbar=1&navpanes=1`} className="doc-viewer__frame" />
        ) : null}

        {!loading && !error && kind === "image" ? (
          <div className="doc-viewer__image-wrap">
            <img
              src={src}
              alt={displayName}
              className="doc-viewer__image"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("No se pudo cargar la imagen.");
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
