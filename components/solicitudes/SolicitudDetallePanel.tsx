"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { firmarSolicitud, revisarSolicitud } from "@/app/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { SolicitudTimeline } from "@/components/solicitudes/SolicitudTimeline";
import { SolicitudVistaPrevia } from "@/components/solicitudes/SolicitudVistaPrevia";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { EmergentAlertModal } from "@/components/ui/EmergentAlertModal";
import { ActionButton } from "@/components/ui/ActionButton";
import { LoadingLink } from "@/components/ui/LoadingLink";
import { observacionRechazoVisible } from "@/lib/solicitud-observaciones";
import { buildSolicitudTimeline } from "@/lib/solicitud-timeline";

export type SolicitudDetalleData = Readonly<{
  id: string;
  tipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  detalle: Record<string, unknown> | null;
  observaciones_secretaria: string | null;
  observaciones_decano: string | null;
  justificativo_path: string | null;
  justificativo_nombre: string | null;
  justificativo_url: string | null;
  anexo_nombre: string | null;
  anexo_url: string | null;
  anexos: ReadonlyArray<{ nombre: string; url: string }>;
  created_at: string;
  updated_at: string;
  fecha_firma: string | null;
  creado_por: string;
  revisado_por: string | null;
  firmado_por: string | null;
  solicitante_nombre: string;
  codigo_tramite: string;
  oficio_preview_html: string | null;
  solicitud_id?: string;
}>;

type Props = Readonly<{
  solicitud: SolicitudDetalleData;
  userId: string;
  puedeRevisar: boolean;
  puedeAprobar: boolean;
  esStaff: boolean;
  esCreador: boolean;
}>;

type RechazoTarget = "secretaria" | "decano" | null;
type ResultadoProceso = null | "aprobada" | "rechazada";

export function SolicitudDetallePanel({
  solicitud,
  userId,
  puedeRevisar,
  puedeAprobar,
  esStaff,
  esCreador
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProceso>(null);
  const [error, setError] = useState<string | null>(null);
  const [rechazoTarget, setRechazoTarget] = useState<RechazoTarget>(null);
  const [comentarioRechazo, setComentarioRechazo] = useState("");

  const timeline = buildSolicitudTimeline(solicitud);
  const tramiteNum = solicitud.codigo_tramite;
  const observacionRechazo = observacionRechazoVisible(solicitud);

  const puedeActuarSecretaria =
    puedeRevisar && solicitud.estado === "en_revision_secretaria" && solicitud.creado_por !== userId;
  const puedeActuarDecano =
    puedeAprobar && solicitud.estado === "pendiente_aprobacion_decano" && solicitud.creado_por !== userId;
  const puedeActuar = (puedeActuarSecretaria || puedeActuarDecano) && !resultado;

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function ejecutarAprobacion(target: "secretaria" | "decano") {
    setProcesando(true);
    setError(null);
    setResultado(null);
    try {
      if (target === "secretaria") {
        await revisarSolicitud(solicitud.id, true, "Aprobado en revisión de Secretaría.");
      } else {
        await firmarSolicitud(solicitud.id, true, "Aprobado y firmado por Decano.");
      }
      setResultado("aprobada");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo aprobar la solicitud.");
    } finally {
      setProcesando(false);
    }
  }

  async function ejecutarRechazo() {
    if (!rechazoTarget) return;
    const comentario = comentarioRechazo.trim();
    if (!comentario) {
      setError("Debe indicar el motivo del rechazo.");
      return;
    }

    setRechazoTarget(null);
    setProcesando(true);
    setError(null);
    setResultado(null);

    try {
      if (rechazoTarget === "secretaria") {
        await revisarSolicitud(solicitud.id, false, comentario);
      } else {
        await firmarSolicitud(solicitud.id, false, comentario);
      }
      setComentarioRechazo("");
      setResultado("rechazada");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo rechazar la solicitud.");
    } finally {
      setProcesando(false);
    }
  }

  const ingreso = new Date(solicitud.created_at);
  const ingresoFmt = Number.isNaN(ingreso.getTime())
    ? solicitud.created_at
    : `${ingreso.getFullYear()}-${String(ingreso.getMonth() + 1).padStart(2, "0")}-${String(ingreso.getDate()).padStart(2, "0")} ${String(ingreso.getHours()).padStart(2, "0")}:${String(ingreso.getMinutes()).padStart(2, "0")}`;

  return (
    <section className="stack solicitud-detalle-panel">
      {procesando ? <LoadingOverlay label="Procesando solicitud…" /> : null}

      <EmergentAlertModal
        open={Boolean(error)}
        title="No se pudo completar"
        message={error ?? ""}
        variant="error"
        onClose={() => setError(null)}
      />

      <EmergentAlertModal
        open={resultado === "aprobada"}
        title="Solicitud procesada"
        message="La solicitud fue procesada correctamente."
        variant="success"
        confirmLabel="Cerrar"
        onClose={() => setResultado(null)}
      />

      <EmergentAlertModal
        open={resultado === "rechazada"}
        title="Solicitud rechazada"
        message="La solicitud fue rechazada y el motivo quedó registrado."
        variant="warning"
        confirmLabel="Cerrar"
        onClose={() => setResultado(null)}
      />

      <div className="tramite-header-bar">
        <LoadingLink
          href={esStaff ? "/solicitudes/proceso-aprobacion" : "/solicitudes"}
          className="tramite-header-bar__back"
          loadingLabel="Volviendo…"
          aria-label="Volver"
        >
          ←
        </LoadingLink>
        <h1 className="tramite-header-bar__title">Detalle del trámite</h1>
      </div>

      <div className="tramite-summary">
        <span>
          <strong>Trámite Nº:</strong> {tramiteNum}
        </span>
        <span>
          <strong>Fecha de ingreso:</strong> {ingresoFmt}
        </span>
      </div>

      <article className="card stack">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="field-hint" style={{ margin: 0 }}>
              Solicitante
            </p>
            <strong>{solicitud.solicitante_nombre}</strong>
          </div>
          <StatusBadge estado={solicitud.estado} />
        </div>

        <SolicitudTimeline events={timeline} />
      </article>

      <SolicitudVistaPrevia
        codigoTramite={solicitud.codigo_tramite}
        oficioPreviewHtml={solicitud.oficio_preview_html}
        solicitudId={solicitud.solicitud_id}
        tipo={solicitud.tipo}
        motivo={solicitud.motivo}
        fechaInicio={solicitud.fecha_inicio}
        fechaFin={solicitud.fecha_fin}
        detalle={solicitud.detalle}
        solicitanteNombre={solicitud.solicitante_nombre}
        justificativoNombre={solicitud.justificativo_nombre}
        justificativoUrl={solicitud.justificativo_url}
        anexoNombre={solicitud.anexo_nombre}
        anexoUrl={solicitud.anexo_url}
        anexos={solicitud.anexos}
      />

      {observacionRechazo ? (
        <article className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Observaciones del proceso</h2>
          <div className="motivo-box">
            <label>{observacionRechazo.label}</label>
            <div>{observacionRechazo.texto}</div>
          </div>
        </article>
      ) : null}

      {puedeActuar ? (
        <article className="card stack">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Acciones</h2>
          <p className="field-hint" style={{ margin: 0 }}>
            Aprueba o rechaza esta solicitud. Si rechaza, deberá indicar el motivo.
          </p>
          <div className="row" style={{ gap: "0.65rem", flexWrap: "wrap" }}>
            <ActionButton
              type="button"
              className="btn--success"
              loading={procesando}
              loadingLabel="Aprobando…"
              onClick={() => ejecutarAprobacion(puedeActuarSecretaria ? "secretaria" : "decano")}
            >
              Aprobar
            </ActionButton>
            <ActionButton
              type="button"
              className="btn--danger"
              disabled={procesando}
              onClick={() => {
                setError(null);
                setComentarioRechazo("");
                setRechazoTarget(puedeActuarSecretaria ? "secretaria" : "decano");
              }}
            >
              Rechazar
            </ActionButton>
          </div>
        </article>
      ) : null}

      {esCreador && solicitud.estado === "en_revision_secretaria" && !resultado ? (
        <div className="row">
          <LoadingLink href={`/solicitudes/${solicitud.id}/editar`} className="btn btn--primary" loadingLabel="Abriendo editor…">
            Editar solicitud
          </LoadingLink>
        </div>
      ) : null}

      {rechazoTarget ? (
        <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="rechazo-modal-title">
          <button
            type="button"
            className="logout-modal__backdrop"
            aria-label="Cerrar"
            onClick={() => setRechazoTarget(null)}
          />
          <div className="logout-modal__panel">
            <h2 id="rechazo-modal-title" className="logout-modal__title">
              Motivo del rechazo
            </h2>
            <p className="logout-modal__text">
              Indique el motivo por el cual rechaza esta solicitud. El comentario quedará registrado en el trámite.
            </p>
            <textarea
              rows={4}
              value={comentarioRechazo}
              onChange={(e) => setComentarioRechazo(e.target.value)}
              placeholder="Escriba el motivo del rechazo..."
              style={{ width: "100%", marginBottom: "1rem", resize: "vertical" }}
              autoFocus
            />
            <div className="logout-modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setRechazoTarget(null)}>
                Cancelar
              </button>
              <ActionButton type="button" className="btn--danger" loading={procesando} loadingLabel="Rechazando…" onClick={ejecutarRechazo}>
                Confirmar rechazo
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
