import type { AppRole } from "@/lib/auth";

const ROL_LABELS: Record<string, string> = {
  docente: "Docente",
  administrativo: "Administrativo",
  mantenimiento: "Personal de mantenimiento",
  secretaria: "Secretaría",
  decano: "Decano",
  superusuario: "Superusuario"
};

/** Roles que un solicitante puede elegir al pedir cuenta (sin superusuario). */
export const ROLES_SOLICITUD_CUENTA = [
  { value: "docente", label: "Docente" },
  { value: "administrativo", label: "Administrativo" },
  { value: "mantenimiento", label: "Personal de mantenimiento" },
  { value: "secretaria", label: "Secretaría" },
  { value: "decano", label: "Decano" }
] as const;

export type RolSolicitudCuenta = (typeof ROLES_SOLICITUD_CUENTA)[number]["value"];

export function labelRolSistema(rol: unknown): string {
  const key = String(rol ?? "").trim();
  return ROL_LABELS[key] ?? (key || "—");
}

export function isRolSolicitudCuentaValido(value: string): value is RolSolicitudCuenta {
  return ROLES_SOLICITUD_CUENTA.some((r) => r.value === value);
}

export function puedeAprobarSolicitudCuenta(rol: AppRole): boolean {
  return rol === "decano" || rol === "superusuario";
}
