import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import {
  buildSolicitudPreviewFields,
  justificativoEsImagen,
  justificativoEsPdf
} from "@/lib/solicitud-preview";

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
    <div className="solicitud-preview__adjunto stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem" }}>{titulo}</h3>
        <a href={url} download={nombre ?? undefined} className="btn btn--secondary btn--sm">
          Descargar
        </a>
      </div>
      <p className="field-hint" style={{ margin: 0 }}>
        {nombre}
      </p>
      {esPdf ? (
        <iframe title={titulo} src={url} className="solicitud-preview__iframe" />
      ) : esImagen ? (
        <img src={url} alt={nombre ?? titulo} className="solicitud-preview__imagen" />
      ) : (
        <p className="field-hint">Vista previa no disponible para este formato. Use el botón de descarga.</p>
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
  anexoUrl
}: Props) {
  const fields = buildSolicitudPreviewFields(tipo, detalle, motivo, fechaInicio, fechaFin);
  const nombreDescarga = `${codigoTramite}.docx`;

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

      {justificativoUrl && oficioPreviewHtml ? (
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
          <iframe
            title="Vista previa del oficio institucional"
            srcDoc={oficioPreviewHtml}
            className="solicitud-preview__iframe"
          />
        </div>
      ) : null}

      <BloqueAdjunto titulo="Documento de respaldo" nombre={anexoNombre ?? null} url={anexoUrl ?? null} />

      {!justificativoUrl && !anexoUrl ? (
        <p className="field-hint" style={{ margin: 0 }}>
          No hay documentos adjuntos.
        </p>
      ) : null}
    </article>
  );
}
