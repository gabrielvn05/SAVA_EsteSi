import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/PageHeader";
import { GenerarReportePanel } from "@/components/secretaria/GenerarReportePanel";
import { getUserProfile, requireAuth } from "@/lib/auth";
import { loadSolicitudesParaReporte } from "@/lib/secretaria-reportes";
import type { FiltroTipoReporte } from "@/lib/reportes-filtros";
import { isTipoReporteSlug, tipoSolicitudFromReporteSlug } from "@/lib/reportes-tipo";

type PageProps = Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
}>;

async function ensureReportesAccess() {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (profile.rol !== "secretaria" && profile.rol !== "decano") {
    redirect("/dashboard");
  }
  return profile;
}

function tipoInicialDesdeQuery(searchParams: PageProps["searchParams"]): FiltroTipoReporte {
  const raw = typeof searchParams.tipo === "string" ? searchParams.tipo : "";
  if (!raw) return "";
  if (isTipoReporteSlug(raw)) return tipoSolicitudFromReporteSlug(raw) as FiltroTipoReporte;
  if (["enfermedad", "viaje", "calamidad_domestica", "falta_marcado"].includes(raw)) return raw as FiltroTipoReporte;
  return "";
}

export default async function SecretariaReportesPage({ searchParams }: PageProps) {
  noStore();
  const profile = await ensureReportesAccess();
  const { rows, error } = await loadSolicitudesParaReporte();
  const generadorNombre = `${profile.nombres} ${profile.apellidos}`.trim();

  return (
    <section className="stack">
      <PageHeader
        title="Reportes"
        subtitle="Consolidado general con filtros por tipo de trámite, fechas, carrera y solicitante."
      />

      {error ? (
        <article className="card">
          <div className="alert alert--error" role="alert">
            No se pudieron cargar las solicitudes. {error}
          </div>
        </article>
      ) : (
        <GenerarReportePanel
          rows={rows}
          generadorNombre={generadorNombre}
          tipoInicial={tipoInicialDesdeQuery(searchParams)}
        />
      )}
    </section>
  );
}
