import { labelJornadaCuenta } from "@/lib/account-request";
import {
  labelMotivoFaltaRegistro,
  labelParentesco,
  labelTipoCalamidad,
  labelTipoMarcacionOmitida,
  labelTipoViajeEvento,
  formatFechaOficio,
  formatRangoFechas
} from "@/lib/certificado/oficio-detalle-labels";
import { labelTipoPersonal, parseTipoPersonal } from "@/lib/certificado/tipo-personal";
import { labelCarrera } from "@/lib/carreras";

export type PreviewField = Readonly<{
  label: string;
  value: string;
}>;

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function push(fields: PreviewField[], label: string, value: unknown) {
  const text = str(value);
  if (text) fields.push({ label, value: text });
}

export function buildSolicitudPreviewFields(
  tipo: string,
  detalle: Record<string, unknown> | null,
  motivo: string,
  fechaInicio: string,
  fechaFin: string
): PreviewField[] {
  const d = detalle ?? {};
  const fields: PreviewField[] = [];

  const tipoPersonal = parseTipoPersonal(d.tipo_personal, "docente");
  push(fields, "Tipo de personal", labelTipoPersonal(tipoPersonal));
  push(fields, "Cédula", d.cedula);
  push(fields, "Carrera", labelCarrera(d.carrera));
  push(fields, "Periodo solicitado", `${fechaInicio} — ${fechaFin}`);
  push(fields, "Motivo", motivo);

  if (tipo === "enfermedad") {
    push(fields, "Fecha de inasistencia", d.fecha_inasistencia);
    push(fields, "Institución médica", d.institucion_medica);
    push(fields, "Médico tratante", d.medico_tratante);
    push(fields, "Fecha emisión certificado", d.fecha_emision_certificado);
    push(fields, "Días de reposo", d.dias_reposo);
    push(fields, "Diagnóstico", d.diagnostico);
  }

  if (tipo === "viaje") {
    push(fields, "Tipo de viaje", labelTipoViajeEvento(d.tipo_viaje_evento));
    push(fields, "Nombre del evento o estudio", d.nombre_evento);
    push(fields, "Lugar (ciudad, país)", d.lugar_evento);
    push(fields, "Fechas del evento", formatRangoFechas(d.fecha_evento_desde, d.fecha_evento_hasta));
    push(fields, "Rol específico", d.rol_especifico);
  }

  if (tipo === "calamidad_domestica") {
    push(fields, "Fecha de inasistencia", d.fecha_inasistencia);
    push(fields, "Tipo de calamidad", labelTipoCalamidad(d.tipo_calamidad));
    push(fields, "Familiar afectado", d.nombre_familiar);
    push(fields, "Parentesco", labelParentesco(d.parentesco));
    push(fields, "Descripción del hecho", d.descripcion_hecho);
    push(fields, "Lugar del suceso", d.lugar_suceso);
    push(fields, "Fecha del hecho", formatFechaOficio(str(d.fecha_hecho)));
  }

  if (tipo === "falta_marcado") {
    push(fields, "Jornada", labelJornadaCuenta(d.jornada));
    push(fields, "Fecha de inasistencia", d.fecha_inasistencia);
    push(fields, "Fecha del incidente", formatFechaOficio(str(d.fecha_incidente)));
    push(fields, "Marcación omitida/fallida", labelTipoMarcacionOmitida(d.tipo_marcacion_omitida));
    push(fields, "Hora real de ingreso", d.hora_real_ingreso);
    push(fields, "Hora real de salida", d.hora_real_salida);
    push(fields, "Motivo de la falta de registro", labelMotivoFaltaRegistro(d.motivo_falta_registro));
    push(fields, "Descripción complementaria", d.descripcion_complementaria);
  }

  push(fields, "Observaciones", d.observaciones);

  return fields;
}

export function justificativoEsPdf(nombre: string | null): boolean {
  return Boolean(nombre?.toLowerCase().endsWith(".pdf"));
}

export function justificativoEsImagen(nombre: string | null): boolean {
  if (!nombre) return false;
  return /\.(png|jpe?g|webp|gif)$/i.test(nombre);
}

export function justificativoEsDocx(nombre: string | null): boolean {
  return Boolean(nombre?.toLowerCase().endsWith(".docx"));
}
