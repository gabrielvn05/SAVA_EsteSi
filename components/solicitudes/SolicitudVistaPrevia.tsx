import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import {
  buildSolicitudPreviewFields,
  justificativoEsImagen,
  justificativoEsPdf
} from "@/lib/solicitud-preview";
import { OficioPreviewLazy } from "@/components/solicitudes/OficioPreviewLazy";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
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
  anexos?: ReadonlyArray<{ nombre: string; url: string }>;
  solicitudId?: string;
}>;

function BloqueAdjunto({
  titulo,
  nombre,
  url
}: Readonly<{ titulo: string; nombre: string | null; url: string | null }>) {
  if (!url) return null;
  const esPdf = justificativoEsPdf(nombre);
  const esImagen = justificativoEsImagen(nombre);

  return (
    <div className="stack" style={{ gap: "0.5rem" }}>
      <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{titulo}</h3>
      <p className="field-hint" style={{ margin: 0 }}>
        {nombre}
      </p>
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
  solicitudId
}: Props) {
  const fields = buildSolicitudPreviewFields(tipo, detalle, motivo, fechaInicio, fechaFin);
  const nombreDescarga = `${codigoTramite}.docx`;
  const adjuntos =
    anexos.length > 0
      ? anexos
      : anexoUrl && anexoNombre
        ? [{ nombre: anexoNombre, url: anexoUrl }]
        : [];

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
      {adjuntos.map((anexo, index) => (
        <BloqueAdjunto
          key={`${anexo.url}-${anexo.nombre}`}
          titulo={adjuntos.length > 1 ? `Documento de respaldo ${index + 1}` : "Documento de respaldo"}
          nombre={anexo.nombre}
          url={anexo.url}
        />
      ))}

      {!justificativoUrl && adjuntos.length === 0 ? (
        <p className="field-hint" style={{ margin: 0 }}>
          No hay documentos adjuntos.
        </p>
      ) : null}
    </article>
  );
}
