import path from "path";
import ExcelJS from "exceljs";
import { labelCarrera } from "@/lib/carreras";
import { labelTipoMarcacionOmitida } from "@/lib/certificado/oficio-detalle-labels";
import { formatPieReporte } from "@/lib/reportes-filtros";
import type { SolicitudListRow } from "@/lib/solicitudes-filters";
import { nombreSolicitante } from "@/lib/solicitudes-filters";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "templates",
  "formato-control-asistencia-uleam.xlsx"
);

const FIRST_DATA_ROW = 9;
const LAST_DATA_ROW = 24;

export type FilaControlAsistencia = Readonly<{
  cedula: string;
  nombreCompleto: string;
  carrera: string;
  entradaJ1: string;
  salidaJ1: string;
  entradaJ2: string;
  salidaJ2: string;
  fechaIncidente: string;
  tipoMarcacion: string;
}>;

function str(v: unknown) {
  return v != null && String(v).trim() ? String(v).trim() : "—";
}

function formatFechaReporte(ref = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(ref.getDate())}/${pad(ref.getMonth() + 1)}/${ref.getFullYear()}`;
}

function formatFechaIncidente(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Reparte horas de entrada y salida según la jornada declarada en la solicitud. */
export function horasPorJornada(
  jornada: string,
  horaIngreso: string,
  horaSalida: string
): { entradaJ1: string; salidaJ1: string; entradaJ2: string; salidaJ2: string } {
  const entrada = horaIngreso || "—";
  const salida = horaSalida || "—";
  if (jornada === "segunda_jornada") {
    return { entradaJ1: "—", salidaJ1: "—", entradaJ2: entrada, salidaJ2: salida };
  }
  if (jornada === "ambas") {
    return { entradaJ1: entrada, salidaJ1: salida, entradaJ2: entrada, salidaJ2: salida };
  }
  return { entradaJ1: entrada, salidaJ1: salida, entradaJ2: "—", salidaJ2: "—" };
}

export function mapFilaControlAsistencia(row: SolicitudListRow): FilaControlAsistencia {
  const d = row.detalle ?? {};
  const jornada = str(d.jornada);
  const horas = horasPorJornada(jornada === "—" ? "primera_jornada" : jornada, str(d.hora_real_ingreso), str(d.hora_real_salida));
  const carreraRaw = str(d.carrera);

  return {
    cedula: str(d.cedula),
    nombreCompleto: nombreSolicitante(row) || "—",
    carrera: carreraRaw !== "—" ? labelCarrera(carreraRaw) : "—",
    ...horas,
    fechaIncidente: formatFechaIncidente(str(d.fecha_incidente) || row.fecha_inicio),
    tipoMarcacion: labelTipoMarcacionOmitida(d.tipo_marcacion_omitida)
  };
}

function copiarEstiloFila(sheet: ExcelJS.Worksheet, desde: number, hacia: number) {
  const src = sheet.getRow(desde);
  const dst = sheet.getRow(hacia);
  dst.height = src.height;
  for (let col = 1; col <= 7; col += 1) {
    const srcCell = src.getCell(col);
    const dstCell = dst.getCell(col);
    if (srcCell.style) dstCell.style = { ...srcCell.style };
    if (srcCell.border) dstCell.border = { ...srcCell.border };
    if (srcCell.alignment) dstCell.alignment = { ...srcCell.alignment };
  }
}

/** Genera el Excel PHM-08-F-003 a partir de la plantilla institucional ULEAM. */
export async function buildControlAsistenciaXlsx(
  filas: FilaControlAsistencia[],
  opts?: { fechaReporte?: Date; generadoPor?: string }
): Promise<Buffer> {
  const fechaReporte = opts?.fechaReporte ?? new Date();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("La plantilla de control de asistencia no tiene hojas.");

  sheet.getCell("A4").value = `Fecha de reporte: ${formatFechaReporte(fechaReporte)}`;

  const capacidad = LAST_DATA_ROW - FIRST_DATA_ROW + 1;
  const extra = Math.max(0, filas.length - capacidad);

  for (let i = 0; i < extra; i += 1) {
    sheet.duplicateRow(LAST_DATA_ROW, 1, true);
  }

  const lastRow = LAST_DATA_ROW + extra;

  for (let i = 0; i < filas.length; i += 1) {
    const rowNum = FIRST_DATA_ROW + i;
    if (rowNum > lastRow) break;
    if (rowNum > LAST_DATA_ROW) copiarEstiloFila(sheet, LAST_DATA_ROW, rowNum);

    const f = filas[i];
    const excelRow = sheet.getRow(rowNum);
    excelRow.getCell(1).value = f.cedula;
    excelRow.getCell(2).value = f.nombreCompleto;
    excelRow.getCell(3).value = f.carrera;
    excelRow.getCell(4).value = f.entradaJ1;
    excelRow.getCell(5).value = f.salidaJ1;
    excelRow.getCell(6).value = f.entradaJ2;
    excelRow.getCell(7).value = f.salidaJ2;
  }

  const pieRow = lastRow + 2;
  sheet.mergeCells(`A${pieRow}:G${pieRow}`);
  const pieCell = sheet.getCell(`A${pieRow}`);
  pieCell.value = formatPieReporte(opts?.generadoPor ?? "", fechaReporte);
  pieCell.font = { italic: true, size: 10 };
  pieCell.alignment = { horizontal: "right" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function nombreArchivoControlAsistencia(fecha = new Date()) {
  const iso = fecha.toISOString().slice(0, 10);
  return `Formato_Control_Asistencia_ULEAM_${iso}.xlsx`;
}
