"use client";

import { useMemo, useState } from "react";
import { DateInput } from "@/components/ui/DateInput";
import { CarreraSelect } from "@/components/ui/CarreraSelect";
import {
  filasReporteACsv,
  mapFilaReporte,
  rangoPeriodoReporte,
  type PeriodoReporte
} from "@/lib/reportes-solicitudes";
import {
  filtrarSolicitudesReporte,
  formatPieReporte,
  type FiltroTipoReporte
} from "@/lib/reportes-filtros";
import { TIPOS_REPORTE_SOLICITUD } from "@/lib/reportes-tipo";
import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";
import { nombreSolicitante } from "@/lib/solicitudes-filters";

type Props = Readonly<{
  rows: SolicitudListRow[];
  generadorNombre: string;
  tipoInicial?: FiltroTipoReporte;
}>;

const PERIODOS: ReadonlyArray<{ id: PeriodoReporte; label: string }> = [
  { id: "semanal", label: "Semanal" },
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" }
];

export function GenerarReportePanel({ rows, generadorNombre, tipoInicial = "" }: Props) {
  const [periodo, setPeriodo] = useState<PeriodoReporte>("mensual");
  const [tipo, setTipo] = useState<FiltroTipoReporte>(tipoInicial);
  const [carrera, setCarrera] = useState("");
  const [usuario, setUsuario] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [errorExcel, setErrorExcel] = useState<string | null>(null);

  const filtradas = useMemo(
    () =>
      filtrarSolicitudesReporte(rows, {
        periodo,
        tipo,
        carrera,
        usuario,
        fechaDesde,
        fechaHasta
      }),
    [rows, periodo, tipo, carrera, usuario, fechaDesde, fechaHasta]
  );

  const filasMarcacion = useMemo(() => filtradas.filter((r) => r.tipo === "falta_marcado"), [filtradas]);
  const mostrarExcel = tipo === "falta_marcado" || (tipo === "" && filasMarcacion.length > 0);
  const filas = useMemo(() => filtradas.map((r) => mapFilaReporte({ ...r, profiles: r.profiles ?? null })), [filtradas]);
  const meta = rangoPeriodoReporte(periodo);
  const pie = formatPieReporte(generadorNombre);

  function descargarCsv() {
    const csv = filasReporteACsv(filas, pie);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sufijo = tipo || "general";
    a.download = `sava-reporte-${sufijo}-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function descargarExcelAsistencia() {
    const rowsExcel = tipo === "falta_marcado" ? filtradas : filasMarcacion;
    setDescargandoExcel(true);
    setErrorExcel(null);
    try {
      const res = await fetch("/api/reportes/control-asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows: rowsExcel, generadoPor: generadorNombre })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "No se pudo generar el Excel.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Formato_Control_Asistencia_ULEAM_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrorExcel(e instanceof Error ? e.message : "No se pudo generar el Excel.");
    } finally {
      setDescargandoExcel(false);
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Reportes generales</h2>
        <p className="field-hint" style={{ margin: 0 }}>
          Filtre por tipo de trámite, periodo, fechas, carrera o solicitante. Los documentos incluyen al final quién
          generó el reporte con fecha y hora.
        </p>

        <div className="solicitud-filters">
          <div>
            <label htmlFor="reporte-tipo">Tipo de trámite</label>
            <select id="reporte-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as FiltroTipoReporte)}>
              <option value="">Todos los tipos</option>
              {TIPOS_REPORTE_SOLICITUD.map((t) => (
                <option key={t.slug} value={t.tipo}>
                  {labelTipoSolicitud(t.tipo)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reporte-usuario">Solicitante / usuario</label>
            <input
              id="reporte-usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Buscar por nombre..."
            />
          </div>
          <div>
            <label htmlFor="reporte-carrera">Carrera</label>
            <CarreraSelect
              id="reporte-carrera"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              includeAllOption
            />
          </div>
          <div>
            <label htmlFor="reporte-desde">Fecha desde</label>
            <DateInput id="reporte-desde" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div>
            <label htmlFor="reporte-hasta">Fecha hasta</label>
            <DateInput id="reporte-hasta" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
        </div>

        <div className="reporte-periodo-tabs" role="tablist" aria-label="Periodo del reporte">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={periodo === p.id}
              className={`reporte-periodo-tabs__btn${periodo === p.id ? " reporte-periodo-tabs__btn--active" : ""}`}
              onClick={() => setPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="field-hint" style={{ margin: 0 }}>
          {meta.label}
          {fechaDesde || fechaHasta ? ` · filtro ${fechaDesde || "…"} — ${fechaHasta || "…"}` : ""} · {filas.length}{" "}
          solicitud{filas.length === 1 ? "" : "es"}
        </p>
        <p className="field-hint" style={{ margin: 0 }}>
          {pie}
        </p>

        <div className="row" style={{ gap: "0.65rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--secondary" disabled={filas.length === 0} onClick={descargarCsv}>
            Descargar CSV
          </button>
          {mostrarExcel ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={filasMarcacion.length === 0 || descargandoExcel}
              onClick={() => descargarExcelAsistencia()}
            >
              {descargandoExcel ? "Generando Excel…" : "Descargar Excel ULEAM (marcación)"}
            </button>
          ) : (
            <button type="button" className="btn btn--primary" disabled={filas.length === 0} onClick={descargarCsv}>
              Descargar reporte (CSV)
            </button>
          )}
        </div>

        {errorExcel ? (
          <div className="alert alert--error" role="alert">
            {errorExcel}
          </div>
        ) : null}
      </article>

      <article className="card card--flat">
        <div className="table-wrap">
          <table className="data-table data-table--compact">
            <thead>
              <tr>
                <th>Trámite</th>
                <th>Solicitante</th>
                <th>Tipo</th>
                <th>Carrera</th>
                <th>Estado</th>
                <th>Periodo</th>
                <th>Fecha ingreso</th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                    No hay solicitudes con estos filtros.
                  </td>
                </tr>
              ) : (
                filas.map((f, i) => (
                  <tr key={filtradas[i]?.id ?? `${f.tramite}-${i}`}>
                    <td>{f.tramite}</td>
                    <td>{nombreSolicitante(filtradas[i]) || f.solicitante}</td>
                    <td>{f.tipo}</td>
                    <td>{f.carrera}</td>
                    <td>{f.estado}</td>
                    <td>{f.periodo}</td>
                    <td>{new Date(f.fechaIngreso).toLocaleString("es-EC")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
