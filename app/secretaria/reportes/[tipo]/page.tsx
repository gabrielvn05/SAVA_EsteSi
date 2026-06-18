import { redirect } from "next/navigation";

type PageProps = Readonly<{
  params: { tipo: string };
}>;

/** Rutas antiguas por tipo redirigen al reporte general con filtro. */
export default function SecretariaReportePorTipoRedirect({ params }: PageProps) {
  redirect(`/secretaria/reportes?tipo=${encodeURIComponent(params.tipo)}`);
}
