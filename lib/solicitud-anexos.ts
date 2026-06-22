export type AnexoSolicitud = Readonly<{
  path: string;
  nombre: string;
  url: string;
}>;

type AnexoDetalle = Readonly<{ path?: unknown; nombre?: unknown }>;

function anexoDesdeObjeto(raw: AnexoDetalle, supabaseBase: string): AnexoSolicitud | null {
  const path = typeof raw.path === "string" ? raw.path.trim() : "";
  const nombre = typeof raw.nombre === "string" ? raw.nombre.trim() : "";
  if (!path || !nombre) return null;
  return {
    path,
    nombre,
    url: `${supabaseBase}/storage/v1/object/public/justificativos/${path}`
  };
}

/** Resuelve anexos desde detalle (soporta `anexos[]` y el formato legado `anexo_path`). */
export function anexosDesdeDetalle(
  detalle: Record<string, unknown> | null,
  supabaseBase: string
): AnexoSolicitud[] {
  if (!detalle) return [];

  const lista = detalle.anexos;
  if (Array.isArray(lista)) {
    const res: AnexoSolicitud[] = [];
    for (const item of lista) {
      if (!item || typeof item !== "object") continue;
      const anexo = anexoDesdeObjeto(item as AnexoDetalle, supabaseBase);
      if (anexo) res.push(anexo);
    }
    if (res.length > 0) return res;
  }

  const legado = anexoDesdeObjeto(
    { path: detalle.anexo_path, nombre: detalle.anexo_nombre },
    supabaseBase
  );
  return legado ? [legado] : [];
}
