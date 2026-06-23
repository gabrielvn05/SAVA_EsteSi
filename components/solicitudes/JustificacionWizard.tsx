"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DateInput } from "@/components/ui/DateInput";
import { crearSolicitudDesdeWizard } from "@/app/actions";
import { useQualityTask } from "@/lib/quality/use-quality-task";
import { addDaysISO, isoDateUTC, threeMonthsAgoUTC, validateFechaInicioMaxTresMeses } from "@/lib/fechas";
import {
  labelTipoPersonal,
  parseTipoPersonal
} from "@/lib/certificado/tipo-personal";
import { validarAnexosObligatorio, validarAnexosOpcional } from "@/lib/certificado/anexo-validators";
import { labelCarrera } from "@/lib/carreras";
import { labelJornadaCuenta, isJornadaCuentaValida } from "@/lib/account-request";
import {
  mensajePerfilInstitucionalIncompleto,
  perfilInstitucionalCompleto,
  type PerfilInstitucional
} from "@/lib/perfil-institucional";
import { buildCodigoTramite, nombreArchivoOficio } from "@/lib/codigo-tramite";
import { soloDigitos } from "@/lib/form-validators";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { ActionButton } from "@/components/ui/ActionButton";
import { MultiFileUpload } from "@/components/ui/MultiFileUpload";
import { EmergentAlertModal } from "@/components/ui/EmergentAlertModal";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { TimeInput } from "@/components/ui/TimeInput";

type Tipo = "enfermedad" | "viaje" | "calamidad_domestica" | "falta_marcado";

type Meta = Readonly<{
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  detalle: Record<string, unknown>;
}>;

const TIPOS_INSTITUCION_MEDICA = [
  "IESS",
  "Ministerio de Salud Pública",
  "Hospital privado",
  "Centro de salud",
  "Otro"
] as const;

function resolverInstitucionMedica(
  tipo: string,
  nombreManual: string
): string {
  if (tipo === "IESS") return "IESS";
  return nombreManual.trim();
}

const TIPOS: ReadonlyArray<Readonly<{ id: Tipo; title: string; description: string }>> = [
  {
    id: "enfermedad",
    title: "Cita médica / certificado de salud",
    description: "Para justificar ausencia por enfermedad o cita médica (según tu rol: docente, administrativo o mantenimiento)."
  },
  {
    id: "viaje",
    title: "Permiso por viaje",
    description: "Para trámites académicos (congresos, capacitaciones) o personales fuera de la ciudad o país."
  },
  {
    id: "calamidad_domestica",
    title: "Calamidad doméstica",
    description: "Para emergencias o situaciones familiares graves que impidan asistir."
  },
  {
    id: "falta_marcado",
    title: "Reporte de novedad en marcación",
    description: "Justificante por olvidos o fallas del sistema Face ID."
  }
];

function Progress({ step }: Readonly<{ step: 0 | 1 }>) {
  return (
    <div className="row" style={{ gap: 8, marginBottom: "1rem" }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 999,
            background: i <= step ? "var(--color-success)" : "var(--color-border)"
          }}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children
}: Readonly<{ label: string; hint?: string; children: ReactNode }>) {
  return (
    <div>
      <label>{label}</label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function JustificacionWizard() {
  const router = useRouter();
  const minFecha = useMemo(() => isoDateUTC(threeMonthsAgoUTC()), []);
  const qualitySolicitud = useQualityTask("wizard:crear-solicitud");

  const [step, setStep] = useState<0 | 1>(0);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [anexos, setAnexos] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);
  const [busyPreview, setBusyPreview] = useState(false);
  const [procesandoNav, setProcesandoNav] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [haVistoPrevia, setHaVistoPrevia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfilDocente, setPerfilDocente] = useState<{
    nombres: string;
    apellidos: string;
    nombre_completo: string;
  } | null>(null);
  const [perfilInstitucional, setPerfilInstitucional] = useState<PerfilInstitucional | null>(null);

  useEffect(() => {
    fetch("/api/perfil", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return null;
        const { parseApiResponse } = await import("@/lib/api/client");
        return parseApiResponse<{
          nombres: string;
          apellidos: string;
          nombre_completo: string;
          tipo_personal: string;
          cedula: string;
          carrera: string;
          jornada: string;
        }>(r);
      })
      .then((j) => {
        if (j?.nombre_completo) {
          const tipoPersonal = parseTipoPersonal(j.tipo_personal);
          const institucional: PerfilInstitucional = {
            tipo_personal: tipoPersonal,
            cedula: (j.cedula ?? "").trim(),
            carrera: (j.carrera ?? "").trim(),
            jornada: (j.jornada ?? "").trim(),
            celular: ""
          };
          setPerfilDocente({
            nombres: j.nombres ?? "",
            apellidos: j.apellidos ?? "",
            nombre_completo: j.nombre_completo
          });
          setPerfilInstitucional(institucional);
          setF((prev) => ({
            ...prev,
            tipo_personal: tipoPersonal,
            cedula: institucional.cedula,
            carrera: institucional.carrera
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPreviewPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setHaVistoPrevia(false);
  }, [f, tipo]);

  function patchField(key: string, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function requireText(key: string, label: string) {
    const v = (f[key] ?? "").trim();
    if (!v) throw new Error(`Completa el campo: ${label}.`);
    return v;
  }

  function datosInstitucionales() {
    if (!perfilInstitucional || !perfilInstitucionalCompleto(perfilInstitucional)) {
      throw new Error(mensajePerfilInstitucionalIncompleto());
    }
    return {
      tipo_personal: perfilInstitucional.tipo_personal,
      cedula: perfilInstitucional.cedula,
      carrera: perfilInstitucional.carrera
    };
  }

  function buildMeta(): Meta {
    if (!tipo) throw new Error("Selecciona un tipo de solicitud.");
    const { tipo_personal, cedula, carrera } = datosInstitucionales();

    if (tipo === "enfermedad") {
      const fecha_inasistencia = requireText("fecha_inasistencia", "Fecha de inasistencia");
      const err = validateFechaInicioMaxTresMeses(fecha_inasistencia);
      if (err) throw new Error(err);

      const institucion_medica_tipo = requireText("institucion_medica_tipo", "Institución médica");
      const nombreEstablecimiento =
        institucion_medica_tipo === "IESS"
          ? ""
          : requireText("institucion_medica_nombre", "Nombre del establecimiento");
      const institucion_medica = resolverInstitucionMedica(institucion_medica_tipo, nombreEstablecimiento);
      const medico_tratante = requireText("medico_tratante", "Médico tratante");
      const fecha_emision_certificado = requireText("fecha_emision_certificado", "Fecha de emisión del certificado");
      const diagnostico = requireText("diagnostico", "Diagnóstico");

      const diasReposoRaw = (f.dias_reposo ?? "").trim();
      const dias = diasReposoRaw ? Math.max(0, Math.floor(Number(diasReposoRaw))) : 0;
      if (diasReposoRaw && Number.isNaN(dias)) throw new Error("Días de reposo inválidos.");

      const fecha_fin = dias > 0 ? addDaysISO(fecha_inasistencia, dias) : fecha_inasistencia;

      const detalle: Record<string, unknown> = {
        tipo_personal,
        cedula,
        carrera,
        fecha_inasistencia,
        institucion_medica_tipo,
        institucion_medica,
        medico_tratante,
        fecha_emision_certificado,
        dias_reposo: diasReposoRaw ? String(dias) : "",
        diagnostico,
        observaciones: (f.observaciones ?? "").trim()
      };

      return {
        fecha_inicio: fecha_inasistencia,
        fecha_fin,
        motivo: `Certificado médico: ${diagnostico}`,
        detalle
      };
    }

    if (tipo === "viaje") {
      const fecha_inicio_viaje = requireText("fecha_inicio_viaje", "Fecha de inicio de la falta");
      const fecha_fin_viaje = requireText("fecha_fin_viaje", "Fecha de retorno");
      if (fecha_fin_viaje < fecha_inicio_viaje) throw new Error("Las fechas del periodo de falta no son válidas.");

      const err = validateFechaInicioMaxTresMeses(fecha_inicio_viaje);
      if (err) throw new Error(err);

      const tipo_viaje_evento = requireText("tipo_viaje_evento", "Tipo de viaje");
      const nombre_evento = requireText("nombre_evento", "Nombre del evento o estudio");
      const lugar_evento = requireText("lugar_evento", "Lugar (ciudad, país)");

      const detalle: Record<string, unknown> = {
        tipo_personal,
        cedula,
        carrera,
        tipo_viaje_evento,
        nombre_evento,
        lugar_evento,
        fecha_evento_desde: fecha_inicio_viaje,
        fecha_evento_hasta: fecha_fin_viaje,
        rol_especifico: (f.rol_especifico ?? "").trim(),
        observaciones: (f.observaciones ?? "").trim()
      };

      return {
        fecha_inicio: fecha_inicio_viaje,
        fecha_fin: fecha_fin_viaje,
        motivo: `Permiso por viaje: ${nombre_evento}`,
        detalle
      };
    }

    if (tipo === "calamidad_domestica") {
      const fecha_inasistencia = requireText("fecha_inasistencia", "Fecha de inasistencia");
      const err = validateFechaInicioMaxTresMeses(fecha_inasistencia);
      if (err) throw new Error(err);

      const tipo_calamidad = requireText("tipo_calamidad", "Tipo de calamidad");
      const nombre_familiar = requireText("nombre_familiar", "Nombre del familiar afectado");
      const parentesco = requireText("parentesco", "Parentesco");
      const descripcion_hecho = requireText("descripcion_hecho", "Descripción del hecho");
      const lugar_suceso = requireText("lugar_suceso", "Lugar donde ocurrió");
      const fecha_hecho = requireText("fecha_hecho", "Fecha del hecho");

      const detalle: Record<string, unknown> = {
        tipo_personal,
        cedula,
        carrera,
        fecha_inasistencia,
        tipo_calamidad,
        nombre_familiar,
        parentesco,
        descripcion_hecho,
        lugar_suceso,
        fecha_hecho,
        observaciones: (f.observaciones ?? "").trim()
      };

      return {
        fecha_inicio: fecha_inasistencia,
        fecha_fin: fecha_inasistencia,
        motivo: `Calamidad doméstica: ${labelTipoCalamidadDetalle(tipo_calamidad)}`,
        detalle
      };
    }

    const fecha_incidente = requireText("fecha_incidente", "Fecha del incidente");
    const errIncidente = validateFechaInicioMaxTresMeses(fecha_incidente);
    if (errIncidente) throw new Error(errIncidente);

    const jornada = requireText("jornada", "Jornada");
    if (!isJornadaCuentaValida(jornada)) throw new Error("Selecciona una jornada válida.");
    const tipo_marcacion_omitida = requireText("tipo_marcacion_omitida", "Tipo de marcación omitida/fallida");
    const hora_real_ingreso = requireText("hora_real_ingreso", "Hora real de ingreso");
    const hora_real_salida = requireText("hora_real_salida", "Hora real de salida");
    const motivo_falta_registro = requireText("motivo_falta_registro", "Motivo de la falta de registro");

    const detalle: Record<string, unknown> = {
      tipo_personal,
      cedula,
      carrera,
      jornada,
      fecha_incidente,
      tipo_marcacion_omitida,
      hora_real_ingreso,
      hora_real_salida,
      motivo_falta_registro,
      descripcion_complementaria: (f.descripcion_complementaria ?? "").trim(),
      observaciones: (f.observaciones ?? "").trim()
    };

    return {
      fecha_inicio: fecha_incidente,
      fecha_fin: fecha_incidente,
      motivo: `Reporte de novedad en marcación (${labelMotivoMarcacionDetalle(motivo_falta_registro)})`,
      detalle
    };
  }

  function labelTipoCalamidadDetalle(v: string) {
    if (v === "fallecimiento_familiar") return "Fallecimiento de familiar";
    if (v === "emergencia_medica_familiar") return "Emergencia médica grave de familiar";
    return v;
  }

  function labelMotivoMarcacionDetalle(v: string) {
    if (v === "olvido_docente") return "Olvido del docente";
    if (v === "falla_face_id") return "Falla Face ID";
    return v;
  }

  function validarAnexoArchivo() {
    if (!tipo) return null;
    const archivos = anexos.map((a) => ({ size: a.size, type: a.type, name: a.name }));
    return validarAnexosObligatorio(tipo, archivos) ?? validarAnexosOpcional(archivos);
  }

  async function verVistaPrevia() {
    if (!tipo) return;
    setBusyPreview(true);
    setError(null);
    try {
      const m = buildMeta();
      const res = await fetch("/api/certificado/preview-oficio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipo,
          fecha_inicio: m.fecha_inicio,
          fecha_fin: m.fecha_fin,
          motivo: m.motivo,
          detalle: m.detalle
        })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "No se pudo generar la vista previa.");
      }
      const blob = await res.blob();
      if (!blob.size) throw new Error("La vista previa PDF está vacía.");
      setPreviewPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setHaVistoPrevia(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar la vista previa.");
    } finally {
      setBusyPreview(false);
    }
  }

  async function descargarOficioDocx() {
    if (!tipo) return;
    setBusyPreview(true);
    setError(null);
    try {
      const m = buildMeta();
      const res = await fetch("/api/certificado/generar-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipo,
          fecha_inicio: m.fecha_inicio,
          fecha_fin: m.fecha_fin,
          motivo: m.motivo,
          detalle: m.detalle
        })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "No se pudo descargar el oficio.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const codigo =
        perfilDocente && tipo
          ? buildCodigoTramite(tipo, perfilDocente.nombres, perfilDocente.apellidos)
          : "oficio-justificacion.docx";
      a.download = codigo.endsWith(".docx") ? codigo : nombreArchivoOficio(codigo);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo descargar el oficio.");
    } finally {
      setBusyPreview(false);
    }
  }

  async function enviarSolicitud() {
    if (!tipo) return;
    setBusy(true);
    setError(null);
    qualitySolicitud.start();
    try {
      const m = buildMeta();
      const anexoErr = validarAnexoArchivo();
      if (anexoErr) throw new Error(anexoErr);

      const fd = new FormData();
      fd.append("tipo", tipo);
      fd.append("fecha_inicio", m.fecha_inicio);
      fd.append("fecha_fin", m.fecha_fin);
      fd.append("motivo", m.motivo);
      fd.append("detalle_json", JSON.stringify(m.detalle));
      for (const archivo of anexos) {
        fd.append("justificativo", archivo);
      }

      const res = await crearSolicitudDesdeWizard(fd);
      if (!res.ok) {
        setError(res.error);
        qualitySolicitud.complete(false);
        return;
      }
      qualitySolicitud.complete(true);
      setProcesandoNav(true);
      router.push("/solicitudes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la solicitud.");
      qualitySolicitud.complete(false);
    } finally {
      if (!procesandoNav) setBusy(false);
    }
  }

  const tipoSeleccionado = tipo ? TIPOS.find((t) => t.id === tipo) : null;

  return (
    <section className="stack page-enter">
      {(busy || procesandoNav) ? (
        <LoadingOverlay label={procesandoNav ? "Redirigiendo…" : "Enviando solicitud…"} />
      ) : null}
      <PageHeader
        title="Nueva solicitud"
        subtitle="Flujo guiado: elige el tipo de trámite, completa el formulario y envía tu solicitud a revisión."
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Link href="/solicitudes" className="btn btn--secondary btn--sm">
              Volver
            </Link>
            <Link href="/solicitudes/nueva/simple" className="btn btn--secondary btn--sm">
              Formulario simple
            </Link>
          </div>
        }
      />

      <Progress step={step} />

      <EmergentAlertModal
        open={Boolean(error)}
        title="Revise los datos"
        message={error ?? ""}
        variant="error"
        onClose={() => setError(null)}
      />

      {step === 0 ? (
        <article className="card stack">
          <h2 style={{ margin: 0 }}>Paso 1: Tipo de solicitud</h2>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Selecciona la opción que mejor describa tu caso. Esto define los campos del formulario de la solicitud.
          </p>

          <div className="wizard-tipo-grid">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`wizard-tipo-card ${tipo === t.id ? "wizard-tipo-card--active" : ""}`}
                onClick={() => {
                  setTipo(t.id);
                  setF({});
                  setAnexos([]);
                  setError(null);
                }}
              >
                <strong className="wizard-tipo-card__title">{t.title}</strong>
                <span className="field-hint wizard-tipo-card__desc">{t.description}</span>
              </button>
            ))}
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn btn--primary"
              type="button"
              disabled={!tipo}
              onClick={() => {
                setError(null);
                setStep(1);
              }}
            >
              Continuar
            </button>
          </div>
        </article>
      ) : null}

      {step === 1 && tipo ? (
        <article className="card stack" style={{ maxWidth: 900 }}>
          <h2 style={{ margin: 0 }}>Paso 2: Datos del trámite</h2>
          <p className="field-hint" style={{ marginTop: 0 }}>
            {tipoSeleccionado?.description} La fecha de inasistencia no puede ser anterior a {minFecha} (ventana de 3 meses).
          </p>

          {perfilDocente ? (
            <p className="field-hint" style={{ marginTop: 0, fontWeight: 600, color: "var(--color-text)" }}>
              La solicitud se registrará a nombre de: {perfilDocente.nombre_completo}
              {perfilInstitucional ? ` (${labelTipoPersonal(perfilInstitucional.tipo_personal)})` : ""}
            </p>
          ) : null}

          {perfilInstitucional && perfilInstitucionalCompleto(perfilInstitucional) ? (
            <article
              className="card card--flat"
              style={{ padding: "0.85rem 1rem", background: "var(--color-surface-muted, #f6f8fb)" }}
            >
              <p className="field-hint" style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "var(--color-text)" }}>
                Datos institucionales (desde su cuenta)
              </p>
              <div className="form-grid form-grid--2" style={{ gap: "0.35rem 1rem" }}>
                <div>
                  <span className="field-hint">Cédula</span>
                  <div>{perfilInstitucional.cedula}</div>
                </div>
                <div>
                  <span className="field-hint">Carrera</span>
                  <div>{labelCarrera(perfilInstitucional.carrera)}</div>
                </div>
                {tipo !== "falta_marcado" && perfilInstitucional.jornada ? (
                  <div>
                    <span className="field-hint">Jornada</span>
                    <div>{labelJornadaCuenta(perfilInstitucional.jornada)}</div>
                  </div>
                ) : null}
              </div>
            </article>
          ) : (
            <div className="alert alert--warning" role="alert">
              {mensajePerfilInstitucionalIncompleto()}
            </div>
          )}

          <div className="stack">
            {tipo !== "viaje" && tipo !== "falta_marcado" ? (
              <Field label="Fecha de inasistencia *" hint="Se valida contra la fecha actual (máximo 3 meses hacia atrás).">
                <DateInput
                  value={f.fecha_inasistencia ?? ""}
                  min={minFecha}
                  onChange={(e) => patchField("fecha_inasistencia", e.target.value)}
                  required
                />
              </Field>
            ) : null}

            {tipo === "enfermedad" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos del certificado médico</h3>
                <div className="form-grid form-grid--2">
                  <Field label="Institución médica *">
                    <select
                      value={f.institucion_medica_tipo ?? ""}
                      onChange={(e) => {
                        patchField("institucion_medica_tipo", e.target.value);
                        if (e.target.value === "IESS") patchField("institucion_medica_nombre", "");
                      }}
                      required
                    >
                      <option value="">Seleccionar</option>
                      {TIPOS_INSTITUCION_MEDICA.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {f.institucion_medica_tipo && f.institucion_medica_tipo !== "IESS" ? (
                    <Field label="Nombre del establecimiento *" hint="Escriba el nombre del centro de atención.">
                      <input
                        value={f.institucion_medica_nombre ?? ""}
                        onChange={(e) => patchField("institucion_medica_nombre", e.target.value)}
                        placeholder="Ej: Hospital Metropolitano"
                        required
                      />
                    </Field>
                  ) : null}
                  <Field label="Médico tratante *">
                    <input value={f.medico_tratante ?? ""} onChange={(e) => patchField("medico_tratante", e.target.value)} placeholder="Dr. Juan Pérez" required />
                  </Field>
                  <Field label="Fecha de emisión del certificado *">
                    <DateInput value={f.fecha_emision_certificado ?? ""} onChange={(e) => patchField("fecha_emision_certificado", e.target.value)} required />
                  </Field>
                  <Field label="Días de reposo" hint="Si no aplica, déjalo vacío (se usará el mismo día de la inasistencia).">
                    <input
                      value={f.dias_reposo ?? ""}
                      onChange={(e) => patchField("dias_reposo", soloDigitos(e.target.value))}
                      placeholder="Ej: 3"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </Field>
                </div>
                <Field label="Diagnóstico *">
                  <textarea rows={4} value={f.diagnostico ?? ""} onChange={(e) => patchField("diagnostico", e.target.value)} required />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            {tipo === "viaje" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos del permiso por viaje</h3>
                <div className="form-grid form-grid--2">
                  <Field label="Fecha inicio de la falta *">
                    <DateInput value={f.fecha_inicio_viaje ?? ""} onChange={(e) => patchField("fecha_inicio_viaje", e.target.value)} required />
                  </Field>
                  <Field label="Fecha de retorno *">
                    <DateInput value={f.fecha_fin_viaje ?? ""} onChange={(e) => patchField("fecha_fin_viaje", e.target.value)} required />
                  </Field>
                </div>
                <Field label="Tipo de viaje *">
                  <select value={f.tipo_viaje_evento ?? ""} onChange={(e) => patchField("tipo_viaje_evento", e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value="estudio">Estudio</option>
                    <option value="congreso_expositor">Congreso – Expositor</option>
                    <option value="congreso_participante">Congreso – Participante (observador)</option>
                  </select>
                </Field>
                <Field label="Nombre del evento o estudio *">
                  <input value={f.nombre_evento ?? ""} onChange={(e) => patchField("nombre_evento", e.target.value)} required />
                </Field>
                <Field label="Lugar (ciudad, país) *">
                  <input value={f.lugar_evento ?? ""} onChange={(e) => patchField("lugar_evento", e.target.value)} placeholder="Ej: Quito, Ecuador" required />
                </Field>
                <Field label="Rol específico (si aplica)" hint="Opcional.">
                  <input value={f.rol_especifico ?? ""} onChange={(e) => patchField("rol_especifico", e.target.value)} placeholder="Ej: Ponente principal" />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            {tipo === "calamidad_domestica" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos de calamidad doméstica</h3>
                <Field label="Tipo de calamidad *">
                  <select value={f.tipo_calamidad ?? ""} onChange={(e) => patchField("tipo_calamidad", e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value="fallecimiento_familiar">Fallecimiento de familiar</option>
                    <option value="emergencia_medica_familiar">Emergencia médica grave de familiar</option>
                  </select>
                </Field>
                <Field label="Nombre completo del familiar afectado *">
                  <input value={f.nombre_familiar ?? ""} onChange={(e) => patchField("nombre_familiar", e.target.value)} required />
                </Field>
                <Field label="Parentesco (hasta segundo grado) *">
                  <select value={f.parentesco ?? ""} onChange={(e) => patchField("parentesco", e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value="conyuge">Cónyuge</option>
                    <option value="madre">Madre</option>
                    <option value="padre">Padre</option>
                    <option value="hermano">Hermano(a)</option>
                    <option value="hijo">Hijo(a)</option>
                  </select>
                </Field>
                <Field label="Descripción del hecho *" hint="Fallecimiento, enfermedad grave, accidente, hospitalización, etc.">
                  <textarea rows={4} value={f.descripcion_hecho ?? ""} onChange={(e) => patchField("descripcion_hecho", e.target.value)} required />
                </Field>
                <Field label="Lugar donde ocurrió *">
                  <input value={f.lugar_suceso ?? ""} onChange={(e) => patchField("lugar_suceso", e.target.value)} required />
                </Field>
                <Field label="Fecha del hecho *">
                  <DateInput value={f.fecha_hecho ?? ""} onChange={(e) => patchField("fecha_hecho", e.target.value)} required />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            {tipo === "falta_marcado" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Reporte de novedad en marcación</h3>
                <p className="field-hint" style={{ margin: 0 }}>
                  Justificante por olvidos o fallas del sistema Face ID.
                </p>
                <Field label="Jornada *" hint="Indique la jornada en la que ocurrió el inconveniente de marcación.">
                  <select value={f.jornada ?? ""} onChange={(e) => patchField("jornada", e.target.value)} required>
                    <option value="">Seleccionar jornada</option>
                    <option value="primera_jornada">Primera jornada</option>
                    <option value="segunda_jornada">Segunda jornada</option>
                    <option value="ambas">Ambas jornadas</option>
                  </select>
                </Field>
                <Field label="Fecha del incidente *" hint="Fecha en que ocurrió el olvido o la falla del sistema.">
                  <DateInput value={f.fecha_incidente ?? ""} onChange={(e) => patchField("fecha_incidente", e.target.value)} required />
                </Field>
                <Field label="Tipo de marcación omitida/fallida *" hint="Seleccione solo una: entrada o salida.">
                  <select value={f.tipo_marcacion_omitida ?? ""} onChange={(e) => patchField("tipo_marcacion_omitida", e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value="entrada">Marcación de entrada</option>
                    <option value="salida">Marcación de salida</option>
                  </select>
                </Field>
                <div className="form-grid form-grid--2">
                  <Field label="Hora real de ingreso *" hint="Seleccione hora (00–23) y minutos (00–59).">
                    <TimeInput
                      value={f.hora_real_ingreso ?? ""}
                      onChange={(e) => patchField("hora_real_ingreso", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Hora real de salida *" hint="Seleccione hora (00–23) y minutos (00–59).">
                    <TimeInput
                      value={f.hora_real_salida ?? ""}
                      onChange={(e) => patchField("hora_real_salida", e.target.value)}
                      required
                    />
                  </Field>
                </div>
                <Field label="Motivo de la falta de registro *">
                  <select value={f.motivo_falta_registro ?? ""} onChange={(e) => patchField("motivo_falta_registro", e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value="olvido_docente">Olvido del docente</option>
                    <option value="falla_face_id">Falla técnica del sistema Face ID</option>
                  </select>
                </Field>
                <Field label="Descripción complementaria (opcional)">
                  <textarea rows={3} value={f.descripcion_complementaria ?? ""} onChange={(e) => patchField("descripcion_complementaria", e.target.value)} />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
            <h3 style={{ margin: 0 }}>Documento de respaldo</h3>
            <p className="field-hint" style={{ margin: 0 }}>
              Al enviar la solicitud se generará automáticamente el oficio institucional en formato Word (.docx) con sus datos.
            </p>
            <Field
              label={tipo === "enfermedad" ? "Adjuntar certificado o soporte médico *" : "Adjuntar documento de respaldo (opcional)"}
              hint={
                tipo === "enfermedad"
                  ? "Obligatorio. Puede adjuntar uno o más archivos (PDF, PNG o JPG), además del oficio generado."
                  : "Opcional. Puede adjuntar uno o más archivos (PDF, PNG o JPG) como respaldo adicional al oficio generado."
              }
            >
              <MultiFileUpload
                files={anexos}
                onChange={setAnexos}
                hint="Use «Agregar archivos» varias veces si desea subir documentos por separado."
              />
            </Field>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
          <h3 style={{ margin: 0 }}>Vista previa del oficio</h3>
          <p className="field-hint" style={{ margin: 0 }}>
            Revise el documento generado antes de enviar la solicitud. El botón de envío se habilitará tras ver la vista previa.
          </p>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <ActionButton
              className="btn--secondary"
              type="button"
              loading={busyPreview}
              loadingLabel="Generando…"
              disabled={busy}
              onClick={() => verVistaPrevia()}
            >
              Vista previa del oficio
            </ActionButton>
            {haVistoPrevia ? (
              <ActionButton
                className="btn--secondary"
                type="button"
                loading={busyPreview}
                loadingLabel="Descargando…"
                disabled={busy}
                onClick={() => descargarOficioDocx()}
              >
                Descargar Word (.docx)
              </ActionButton>
            ) : null}
          </div>
          {previewPdfUrl && perfilDocente && tipo ? (
            <DocumentViewer
              title="Vista previa del oficio"
              fileName={nombreArchivoOficio(buildCodigoTramite(tipo, perfilDocente.nombres, perfilDocente.apellidos)).replace(
                /\.docx$/i,
                ".pdf"
              )}
              src={previewPdfUrl}
              downloadHref={previewPdfUrl}
              direct
            />
          ) : null}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btn--secondary" type="button" onClick={() => setStep(0)}>
              Atrás
            </button>
            <ActionButton
              className="btn--primary"
              type="button"
              loading={busy || procesandoNav}
              loadingLabel="Enviando…"
              disabled={!haVistoPrevia || busyPreview}
              title={!haVistoPrevia ? "Genere la vista previa del oficio antes de enviar" : undefined}
              onClick={() => enviarSolicitud()}
            >
              Enviar solicitud
            </ActionButton>
          </div>
        </article>
      ) : null}
    </section>
  );
}
