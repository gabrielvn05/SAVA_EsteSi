import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { labelCarrera } from "@/lib/carreras";
import {
  formatFechaOficio,
  formatRangoFechas,
  labelMotivoFaltaRegistro,
  labelParentesco,
  labelTipoCalamidad,
  labelTipoMarcacionOmitida,
  labelTipoViajeEvento
} from "@/lib/certificado/oficio-detalle-labels";
import type { OficioDestinatario } from "@/lib/certificado/oficio-placeholders";
import type { buildOficioReplacements } from "@/lib/certificado/oficio-placeholders";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function str(v: unknown) {
  return v != null && String(v).trim() ? String(v).trim() : "—";
}

function replaceAll(xml: string, pairs: Array<[string, string]>) {
  let out = xml;
  for (const [from, to] of pairs) {
    if (!from) continue;
    out = out.split(from).join(to);
    out = out.split(escapeXml(from)).join(escapeXml(to));
  }
  return out;
}

/** Sustituye marcadores partidos en varios nodos <w:t> de Word (orden de aparición). */
export function replaceSequentialInXml(xml: string, marker: string, values: string[]): string {
  if (!marker || values.length === 0) return xml;
  let index = 0;
  let from = 0;
  let out = "";
  while (from <= xml.length) {
    const pos = xml.indexOf(marker, from);
    if (pos === -1) {
      out += xml.slice(from);
      break;
    }
    out += xml.slice(from, pos);
    out += index < values.length ? escapeXml(values[index]) : marker;
    index += 1;
    from = pos + marker.length;
  }
  return out;
}

function carreraParaOficio(d: Record<string, unknown>) {
  return labelCarrera(d.carrera_label ?? d.carrera);
}

/** Reemplaza [Nombre] aunque Word lo parta en varios nodos <w:t>. */
export function replaceBracketPlaceholder(xml: string, name: string, value: string): string {
  const escaped = escapeXml(value);
  let out = replaceAll(xml, [[`[${name}]`, escaped]]);
  const re = new RegExp(`\\[(?:[^\\[\\]]|<[^>]+>)*${name}(?:[^\\[\\]]|<[^>]+>)*\\]`, "gi");
  return out.replace(re, escaped);
}

function applyCommonReplacements(
  xml: string,
  destinatario: OficioDestinatario,
  r: ReturnType<typeof buildOficioReplacements>,
  d: Record<string, unknown>
) {
  const decanoNombre = `${destinatario.nombres} ${destinatario.apellidos}`.trim();
  const carreraLabel = carreraParaOficio(d);

  let out = replaceAll(xml, [
    ["FCVT-MMAAAA-NNNN", escapeXml(r.numero_oficio)],
    ["FCVT-032026-0005", escapeXml(r.numero_oficio)],
    [
      "Docente de la facultad [Facultad]",
      escapeXml(`${r.nombre_solicitante} — ${r.cargo_firma}`)
    ],
    ["Decano de la facultad [Facultad]", escapeXml(`Decano de la ${FACULTAD_DEFAULT}`)],
    ["Ángel Cristian Mera Macias", escapeXml(decanoNombre)],
    ["Ángel Cristian", escapeXml(destinatario.nombres)],
    ["Mera Macias", escapeXml(destinatario.apellidos)],
    ["[Nombre completo del docente]", escapeXml(r.nombre_docente)],
    ["[Número de cédula]", escapeXml(r.cedula)],
    ["[Cédula]", escapeXml(r.cedula)],
    ["[Carrera]", escapeXml(carreraLabel)],
    ["docente de la [Carrera] de la", escapeXml(`docente de la ${carreraLabel} de la`)],
    ["[facultad]", escapeXml(FACULTAD_DEFAULT)],
    ["la [facultad]", escapeXml(`la ${FACULTAD_DEFAULT}`)],
    ["[Facultad]", escapeXml(FACULTAD_DEFAULT)],
    ["[Fecha de inicio de la falta]", escapeXml(r.fecha_inicio)],
    ["[Fecha de retorno a clases]", escapeXml(r.fecha_fin)],
    ["[Número de días]", escapeXml(r.dias_ausencia)],
    ["[Lugar donde se realizó la atención médica]", escapeXml(str(d.institucion_medica))],
    ["[Nombre completo del doctor(a)]", escapeXml(str(d.medico_tratante))],
    ["[Diagnóstico principal]", escapeXml(str(d.diagnostico))],
    ["[Correo]", escapeXml(r.correo_docente)],
    ["[Fecha automática del sistema]", escapeXml(r.fecha_generacion)],
    ["[Fecha en que ocurrió el olvido o la falla del sistema]", escapeXml(formatFechaOficio(str(d.fecha_incidente)))],
    ["[Hora real en que llegó a la institución]", escapeXml(str(d.hora_real_ingreso))],
    ["[Hora real en que se retiró de la institución]", escapeXml(str(d.hora_real_salida))],
    ["Ciencias de la vida y ", escapeXml(`${FACULTAD_DEFAULT} `)],
    ["tecnologias", ""]
  ]);

  out = replaceBracketPlaceholder(out, "Carrera", carreraLabel);
  return out;
}

function applyViajeReplacements(xml: string, d: Record<string, unknown>) {
  const rol = str(d.rol_especifico);
  return replaceSequentialInXml(xml, "traer de selección", [
    labelTipoViajeEvento(d.tipo_viaje_evento),
    str(d.nombre_evento),
    str(d.lugar_evento),
    formatRangoFechas(d.fecha_evento_desde, d.fecha_evento_hasta),
    rol === "—" ? "No aplica" : rol
  ]);
}

function applyCalamidadReplacements(xml: string, d: Record<string, unknown>) {
  let out = replaceAll(xml, [
    [
      "Tipo de calamidad: (selección automática del sistema según lo elegido por el docente)",
      escapeXml(`Tipo de calamidad: ${labelTipoCalamidad(d.tipo_calamidad)}`)
    ]
  ]);
  out = replaceSequentialInXml(out, "traer de selección del sistema", [str(d.nombre_familiar)]);
  return replaceSequentialInXml(out, "traer de selección", [
    labelParentesco(d.parentesco),
    str(d.descripcion_hecho),
    str(d.lugar_suceso),
    formatFechaOficio(str(d.fecha_hecho))
  ]);
}

function applyMarcacionReplacements(xml: string, d: Record<string, unknown>) {
  const desc = str(d.descripcion_complementaria);
  let out = replaceAll(xml, [
    [
      "Motivo de la falta de registro (selección automática del sistema según lo elegido por el docente):",
      "Motivo de la falta de registro:"
    ]
  ]);
  return replaceSequentialInXml(out, " (traer de selección)", [
    "",
    labelTipoMarcacionOmitida(d.tipo_marcacion_omitida),
    "",
    "",
    labelMotivoFaltaRegistro(d.motivo_falta_registro),
    desc === "—" ? "—" : desc
  ]);
}

/** Rellena marcadores [campo] y textos dinámicos en document.xml. */
export function applyOficioDocumentXml(
  xml: string,
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario,
  r: ReturnType<typeof buildOficioReplacements>
) {
  const d = input.detalle;
  let out = applyCommonReplacements(xml, destinatario, r, d);

  if (input.tipo === "viaje") out = applyViajeReplacements(out, d);
  if (input.tipo === "calamidad_domestica") out = applyCalamidadReplacements(out, d);
  if (input.tipo === "falta_marcado") out = applyMarcacionReplacements(out, d);

  out = out
    .split(escapeXml("docente de la  de la "))
    .join(escapeXml(`docente de la ${FACULTAD_DEFAULT}, `))
    .split("docente de la  de la ")
    .join(`docente de la ${FACULTAD_DEFAULT}, `);

  return out;
}
