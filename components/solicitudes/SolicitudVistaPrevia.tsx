"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { eliminarAnexoSolicitud } from "@/app/actions";
import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import {
  buildSolicitudPreviewFields,
  justificativoEsImagen,
  justificativoEsPdf
} from "@/lib/solicitud-preview";
import { OficioPreviewLazy } from "@/components/solicitudes/OficioPreviewLazy";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmergentPromptModal } from "@/components/ui/EmergentAlertModal";

type AnexoItem = Readonly<{ path: string; nombre: string; url: string }>;

type Props = Readonly<{
  codigoTramite: string;
  oficioPreviewHtml: string | null;
  tipo: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  detalle: Record<string, unknown> | null;
  solicitanteNombre: string;
  justificativoNombre: string | null;
  justificativoUrl: string | null;
  anexoNombre?: string | null;
  anexoUrl?: string | null;
  anexos?: ReadonlyArray<AnexoItem>;
  solicitudId?: string;
  puedeEliminarAnexos?: boolean;
}>;

function BloqueAdjunto({
  titulo,
  nombre,
  url,
  path,
  puedeEliminar,
  eliminando,
  onEliminar
}: Readonly<{
  titulo: string;
  nombre: string | null;
  url: string | null;
  path?: string;
  puedeEliminar?: boolean;
  eliminando?: boolean;
  onEliminar?: () => void;
}>) {
  if (!url) return null;
  const esPdf = justificativoEsPdf(nombre);
  const esImagen = justificativoEsImagen(nombre);

  return (
    <div className="stack" style={{ gap: "0.5rem" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{titulo}</h3>
          <p className="field-hint" style={{ margin: 0 }}>
            {nombre}
          </p>
        </div>
        {puedeEliminar && path && onEliminar ? (
          <ActionButton type="button" className="btn--danger btn--sm" loading={eliminando} loadingLabel="Eliminando…" onClick={onEliminar}>
            Eliminar documento
          </ActionButton>
        ) : null}
      </div>
      {esPdf ? (
        <DocumentViewer title={titulo} fileName={nombre ?? "documento.pdf"} src={url} downloadHref={url} direct />
      ) : esImagen ? (
        <DocumentViewer title={titulo} fileName={nombre ?? "imagen"} src={url} downloadHref={url} direct kind="image" />
      ) : (
        <p className="field-hint">Vista previa no disponible para este formato. Use el botón de descarga del visor.</p>
      )}
    </div>
  );
}

export function SolicitudVistaPrevia({
  codigoTramite,
  oficioPreviewHtml,
  tipo,
  motivo,
  fechaInicio,
  fechaFin,
  detalle,
  solicitanteNombre,
  justificativoNombre,
  justificativoUrl,
  anexoNombre,
  anexoUrl,
  anexos = [],
  solicitudId,
  puedeEliminarAnexos = false
}: Props) {
  const router = useRouter();
  const [eliminandoPath, setEliminandoPath] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<AnexoItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = buildSolicitudPreviewFields(tipo, detalle, motivo, fechaInicio, fechaFin);
  const nombreDescarga = `${codigoTramite}.docx`;
  const adjuntos: AnexoItem[] =
    anexos.length > 0
      ? [...anexos]
      : anexoUrl && anexoNombre
        ? [{ path: "", nombre: anexoNombre, url: anexoUrl }]
        : [];

  function ejecutarEliminar() {
    if (!confirmarEliminar?.path || !solicitudId) return;
    setError(null);
    setEliminandoPath(confirmarEliminar.path);
    void eliminarAnexoSolicitud(solicitudId, confirmarEliminar.path)
      .then(() => {
        setConfirmarEliminar(null);
        router.refresh();
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "No se pudo eliminar el documento.");
      })
      .finally(() => {
        setEliminandoPath(null);
      });
  }

  return (
    <article className="card stack solicitud-preview">
      <div className="solicitud-preview__header">
        <h2 className="solicitud-preview__title">Vista previa de la solicitud</h2>
        <span className="solicitud-preview__tipo">{labelTipoSolicitud(tipo)}</span>
      </div>

      <div className="solicitud-preview__doc">
        <div className="solicitud-preview__doc-head">
          <p className="solicitud-preview__doc-label">Solicitud de trámite</p>
          <p className="solicitud-preview__doc-solicitante">{solicitanteNombre}</p>
          <p className="field-hint" style={{ margin: "0.25rem 0 0" }}>
            Código: <strong>{codigoTramite}</strong>
          </p>
        </div>

        <dl className="solicitud-preview__fields">
          {fields.map((f) => (
            <div key={f.label} className="solicitud-preview__field">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {justificativoUrl ? (
        <OficioPreviewLazy
          solicitudId={solicitudId}
          justificativoUrl={justificativoUrl}
          justificativoNombre={justificativoNombre}
          nombreDescarga={nombreDescarga}
        />
      ) : null}

      {error ? (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      ) : null}

      {adjuntos.map((anexo, index) => (
        <BloqueAdjunto
          key={`${anexo.path || anexo.url}-${anexo.nombre}`}
          titulo={adjuntos.length > 1 ? `Documento de respaldo ${index + 1}` : "Documento de respaldo"}
          nombre={anexo.nombre}
          url={anexo.url}
          path={anexo.path}
          puedeEliminar={puedeEliminarAnexos && Boolean(anexo.path)}
          eliminando={eliminandoPath === anexo.path}
          onEliminar={() => setConfirmarEliminar(anexo)}
        />
      ))}

      {!justificativoUrl && adjuntos.length === 0 ? (
        <p className="field-hint" style={{ margin: 0 }}>
          No hay documentos adjuntos.
        </p>
      ) : null}

      <EmergentPromptModal
        open={Boolean(confirmarEliminar)}
        title="Eliminar documento"
        description={`¿Eliminar «${confirmarEliminar?.nombre ?? "documento"}»? Esta acción no se puede deshacer.`}
        value=""
        onChange={() => {}}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        loading={eliminandoPath !== null}
        onConfirm={ejecutarEliminar}
        onCancel={() => setConfirmarEliminar(null)}
      >
        <p className="logout-modal__text" style={{ margin: "0 0 1rem" }}>
          Solo se elimina este documento de respaldo. El oficio Word institucional no se modifica.
        </p>
      </EmergentPromptModal>
    </article>
  );
}
