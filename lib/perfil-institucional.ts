import type { AppRole } from "@/lib/auth";
import { labelCarrera } from "@/lib/carreras";
import { labelJornadaCuenta } from "@/lib/account-request";
import { parseTipoPersonal, labelTipoPersonal, type TipoPersonal } from "@/lib/certificado/tipo-personal";

export type PerfilInstitucional = Readonly<{
  cedula: string;
  carrera: string;
  jornada: string;
  celular: string;
  tipo_personal: TipoPersonal;
}>;

export type ProfileInstitucionalRow = Readonly<{
  rol: AppRole | string;
  cedula?: string | null;
  carrera?: string | null;
  jornada?: string | null;
  celular?: string | null;
}>;

export function rolToTipoPersonal(rol: unknown): TipoPersonal {
  switch (String(rol ?? "").trim()) {
    case "mantenimiento":
      return "mantenimiento";
    case "administrativo":
    case "secretaria":
    case "decano":
      return "administrativo";
    case "docente":
      return "docente";
    default:
      return "docente";
  }
}

export function resolverPerfilInstitucional(row: ProfileInstitucionalRow): PerfilInstitucional {
  return {
    cedula: String(row.cedula ?? "").trim(),
    carrera: String(row.carrera ?? "").trim(),
    jornada: String(row.jornada ?? "").trim(),
    celular: String(row.celular ?? "").trim(),
    tipo_personal: rolToTipoPersonal(row.rol)
  };
}

export function perfilInstitucionalCompleto(p: PerfilInstitucional): boolean {
  return Boolean(p.cedula && p.carrera);
}

export function mensajePerfilInstitucionalIncompleto(): string {
  return "Tu perfil no tiene cédula o carrera registradas. Solicita al Decanato que revise tu solicitud de cuenta aceptada o contacta a Secretaría.";
}

export function detalleInstitucionalDesdePerfil(p: PerfilInstitucional): Record<string, string> {
  return {
    tipo_personal: p.tipo_personal,
    cedula: p.cedula,
    carrera: p.carrera,
    carrera_label: labelCarrera(p.carrera),
    jornada: p.jornada
  };
}

export function resumenPerfilInstitucional(p: PerfilInstitucional): ReadonlyArray<{ label: string; value: string }> {
  return [
    { label: "Tipo de personal", value: labelTipoPersonal(p.tipo_personal) },
    { label: "Cédula", value: p.cedula || "—" },
    { label: "Carrera", value: labelCarrera(p.carrera) },
    { label: "Jornada", value: labelJornadaCuenta(p.jornada) }
  ];
}

export function camposInstitucionalesDesdeSolicitudCuenta(req: {
  cedula?: string | null;
  carrera?: string | null;
  jornada?: string | null;
  celular?: string | null;
}) {
  return {
    cedula: String(req.cedula ?? "").trim(),
    carrera: String(req.carrera ?? "").trim(),
    jornada: String(req.jornada ?? "").trim(),
    celular: String(req.celular ?? "").trim()
  };
}
