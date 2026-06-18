export const CARRERAS_OPCIONES = [
  { value: "software", label: "SOFTWARE" },
  { value: "tecnologias_informacion", label: "TECNOLOGIAS DE LA INFORMACION" },
  { value: "agroindustria", label: "AGROINDUSTRIA" },
  { value: "agropecuaria", label: "AGROPECUARIA" },
  { value: "agronegocios", label: "AGRONEGOCIOS" },
  { value: "biologia", label: "BIOLOGIA" },
  { value: "ambiente", label: "AMBIENTE" }
] as const;

export type CarreraValue = (typeof CARRERAS_OPCIONES)[number]["value"];

const LABELS = Object.fromEntries(CARRERAS_OPCIONES.map((c) => [c.value, c.label])) as Record<CarreraValue, string>;

export function labelCarrera(value: unknown): string {
  const key = String(value ?? "").trim();
  if (!key) return "—";
  return LABELS[key as CarreraValue] ?? key;
}

export function isCarreraValida(value: string): value is CarreraValue {
  return (CARRERAS_OPCIONES as readonly { value: string }[]).some((c) => c.value === value);
}
