import { labelTipoSolicitud } from "@/lib/solicitud-tipo-labels";
import type { SidebarNavLink } from "@/components/sidebar-nav-types";

export const TIPOS_REPORTE_SOLICITUD = [
  { slug: "enfermedad", tipo: "enfermedad" },
  { slug: "viaje", tipo: "viaje" },
  { slug: "calamidad_domestica", tipo: "calamidad_domestica" },
  { slug: "falta_marcado", tipo: "falta_marcado" }
] as const;

export type TipoReporteSlug = (typeof TIPOS_REPORTE_SOLICITUD)[number]["slug"];

export function labelReporteTipo(slug: TipoReporteSlug): string {
  const entry = TIPOS_REPORTE_SOLICITUD.find((t) => t.slug === slug);
  return entry ? labelTipoSolicitud(entry.tipo) : slug;
}

export function isTipoReporteSlug(value: string): value is TipoReporteSlug {
  return TIPOS_REPORTE_SOLICITUD.some((t) => t.slug === value);
}

export function tipoSolicitudFromReporteSlug(slug: TipoReporteSlug): string {
  return TIPOS_REPORTE_SOLICITUD.find((t) => t.slug === slug)!.tipo;
}

export function reporteNavItems(): SidebarNavLink[] {
  return [
    { href: "/secretaria/reportes", label: "Consolidado general" },
    ...TIPOS_REPORTE_SOLICITUD.map((t) => ({
      href: `/secretaria/reportes/${t.slug}`,
      label: labelTipoSolicitud(t.tipo)
    }))
  ];
}
