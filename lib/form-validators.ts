/** Solo dígitos (cédula ecuatoriana). */
export function soloDigitos(value: string): string {
  return value.replace(/\D/g, "");
}

/** Solo dígitos para celular (permite + al inicio al pegar). */
export function soloCelular(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/** Correo debe contener @ y texto antes y después. */
export function isEmailConArroba(value: string): boolean {
  const v = value.trim();
  const at = v.indexOf("@");
  return at > 0 && at < v.length - 1 && !/\s/.test(v);
}
