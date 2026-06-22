"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { aprobarSolicitudCuenta, rechazarSolicitudCuenta } from "@/app/actions";
import { labelCarrera } from "@/lib/carreras";
import { labelRolSistema } from "@/lib/rol-labels";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmergentAlertModal, EmergentPromptModal } from "@/components/ui/EmergentAlertModal";

export type SolicitudCuentaRow = Readonly<{
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  celular: string;
  carrera: string;
  rol_solicitado: string;
  status: string;
}>;

type Props = Readonly<{
  rows: SolicitudCuentaRow[];
  puedeAceptar: boolean;
  puedeRechazar: boolean;
  comentarioRechazoObligatorio: boolean;
}>;

export function SolicitudesCuentaTable({ rows, puedeAceptar, puedeRechazar, comentarioRechazoObligatorio }: Props) {
  const router = useRouter();
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [comentarioRechazo, setComentarioRechazo] = useState("");
  const [alerta, setAlerta] = useState<{ title: string; message: string; variant: "error" | "success" } | null>(null);

  const ocupado = procesandoId !== null;

  async function aprobar(requestId: string) {
    setProcesandoId(requestId);
    try {
      const fd = new FormData();
      fd.append("request_id", requestId);
      await aprobarSolicitudCuenta(fd);
      setAlerta({ title: "Solicitud aceptada", message: "El usuario fue creado y se envió el correo con la clave temporal.", variant: "success" });
      router.refresh();
    } catch (e) {
      setAlerta({
        title: "No se pudo aceptar",
        message: e instanceof Error ? e.message : "Ocurrió un error al aceptar la solicitud.",
        variant: "error"
      });
    } finally {
      setProcesandoId(null);
    }
  }

  async function confirmarRechazo() {
    if (!rechazoId) return;
    const comentario = comentarioRechazo.trim();
    if (comentarioRechazoObligatorio && !comentario) {
      setAlerta({
        title: "Comentario requerido",
        message: "Debes indicar el motivo del rechazo.",
        variant: "error"
      });
      return;
    }

    setProcesandoId(rechazoId);
    try {
      const fd = new FormData();
      fd.append("request_id", rechazoId);
      fd.append("comentario", comentario);
      await rechazarSolicitudCuenta(fd);
      setRechazoId(null);
      setComentarioRechazo("");
      setAlerta({ title: "Solicitud rechazada", message: "La solicitud de cuenta fue marcada como rechazada.", variant: "success" });
      router.refresh();
    } catch (e) {
      setAlerta({
        title: "No se pudo rechazar",
        message: e instanceof Error ? e.message : "Ocurrió un error al rechazar la solicitud.",
        variant: "error"
      });
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <>
      {ocupado ? <LoadingOverlay label="Procesando solicitud de cuenta…" /> : null}

      <EmergentAlertModal
        open={Boolean(alerta)}
        title={alerta?.title ?? ""}
        message={alerta?.message ?? ""}
        variant={alerta?.variant ?? "error"}
        onClose={() => setAlerta(null)}
      />

      <EmergentPromptModal
        open={Boolean(rechazoId)}
        title="Motivo del rechazo"
        description={
          comentarioRechazoObligatorio
            ? "Indique el motivo por el cual rechaza esta solicitud de cuenta. El comentario es obligatorio."
            : "Indique el motivo del rechazo (opcional). El comentario quedará registrado en la solicitud."
        }
        value={comentarioRechazo}
        onChange={setComentarioRechazo}
        placeholder="Escriba el motivo del rechazo…"
        required={comentarioRechazoObligatorio}
        confirmLabel="Confirmar rechazo"
        loading={ocupado}
        onConfirm={confirmarRechazo}
        onCancel={() => {
          if (ocupado) return;
          setRechazoId(null);
          setComentarioRechazo("");
        }}
      />

      <article className="card card--flat">
        <div className="table-wrap">
          <table className="data-table data-table--compact">
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Cédula</th>
                <th>Correo</th>
                <th>Celular</th>
                <th>Carrera</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                    No hay solicitudes.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>
                        {r.nombres} {r.apellidos}
                      </strong>
                    </td>
                    <td>{r.cedula || "—"}</td>
                    <td>{r.email}</td>
                    <td>{r.celular || "—"}</td>
                    <td>{labelCarrera(r.carrera)}</td>
                    <td>{labelRolSistema(r.rol_solicitado)}</td>
                    <td>{r.status}</td>
                    <td>
                      <div className="cell-actions cell-actions--inline">
                        {r.status === "pendiente" ? (
                          <>
                            {puedeAceptar ? (
                              <ActionButton
                                type="button"
                                className="btn--success btn--sm"
                                loading={procesandoId === r.id && !rechazoId}
                                loadingLabel="Aceptando…"
                                disabled={ocupado}
                                onClick={() => aprobar(r.id)}
                              >
                                Aceptar
                              </ActionButton>
                            ) : null}
                            {puedeRechazar ? (
                              <button
                                type="button"
                                className="btn btn--danger btn--sm"
                                disabled={ocupado}
                                onClick={() => {
                                  setComentarioRechazo("");
                                  setRechazoId(r.id);
                                }}
                              >
                                Rechazar
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="field-hint">Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
