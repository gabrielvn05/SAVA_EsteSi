import { isCarreraValida } from "@/lib/carreras";
import { isEmailConArroba } from "@/lib/form-validators";
import { isRolSolicitudCuentaValido } from "@/lib/rol-labels";

export const JORNADAS_CUENTA = ["primera_jornada", "segunda_jornada", "ambas"] as const;
export type JornadaCuenta = (typeof JORNADAS_CUENTA)[number];

export function labelJornadaCuenta(value: unknown): string {
  switch (String(value ?? "").trim()) {
    case "primera_jornada":
      return "Primera jornada";
    case "segunda_jornada":
      return "Segunda jornada";
    case "ambas":
      return "Ambas jornadas";
    default:
      return String(value ?? "").trim() || "—";
  }
}

export function normalizeCedula(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCelular(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function isCedulaValida(value: string): boolean {
  const digits = normalizeCedula(value);
  return digits.length >= 10 && digits.length <= 13;
}

export function isCelularValido(value: string): boolean {
  const digits = normalizeCelular(value);
  return digits.length >= 9 && digits.length <= 15;
}

export function isJornadaCuentaValida(value: string): value is JornadaCuenta {
  return (JORNADAS_CUENTA as readonly string[]).includes(value);
}

export type AccountRequestFormInput = {
  email: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  celular: string;
  carrera: string;
  jornada: string;
  rol_solicitado: string;
};

export type AccountRequestValidation =
  | { ok: true; data: AccountRequestFormInput & { cedula: string; celular: string; jornada: string } }
  | { ok: false; aviso: string };

export function validateAccountRequestForm(raw: AccountRequestFormInput): AccountRequestValidation {
  const email = raw.email.trim().toLowerCase();
  const nombres = raw.nombres.trim();
  const apellidos = raw.apellidos.trim();
  const cedula = normalizeCedula(raw.cedula);
  const celular = normalizeCelular(raw.celular);
  const carrera = raw.carrera.trim();
  const rol_solicitado = raw.rol_solicitado.trim() || "administrativo";

  if (!email || !nombres || !apellidos || !cedula || !celular || !carrera) {
    return { ok: false, aviso: "datos_incompletos" };
  }
  if (!isEmailConArroba(email)) {
    return { ok: false, aviso: "correo_invalido" };
  }
  if (!isCarreraValida(carrera)) {
    return { ok: false, aviso: "carrera_invalida" };
  }
  if (!isRolSolicitudCuentaValido(rol_solicitado)) {
    return { ok: false, aviso: "rol_invalido" };
  }
  if (!isCedulaValida(cedula)) {
    return { ok: false, aviso: "cedula_invalida" };
  }
  if (!isCelularValido(celular)) {
    return { ok: false, aviso: "celular_invalido" };
  }
  return {
    ok: true,
    data: { email, nombres, apellidos, cedula, celular, carrera, jornada: "", rol_solicitado }
  };
}
