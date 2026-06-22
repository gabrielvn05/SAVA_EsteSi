import { PageHeader } from "@/components/PageHeader";
import { SolicitudesCuentaTable } from "@/components/admin/SolicitudesCuentaTable";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUserProfile, requireAuth } from "@/lib/auth";
import { puedeAprobarSolicitudCuenta } from "@/lib/rol-labels";
import { unstable_noStore as noStore } from "next/cache";

export default async function SolicitudesCuentaPage() {
  noStore();
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esDecano = profile.rol === "decano";
  const esSecretaria = profile.rol === "secretaria";
  const esSuper = profile.rol === "superusuario";
  const puedeAceptar = puedeAprobarSolicitudCuenta(profile.rol);

  if (!esDecano && !esSecretaria && !esSuper) {
    return (
      <section className="stack">
        <PageHeader title="Solicitudes de cuenta" subtitle="Módulo reservado para Decano y Secretaría." />
        <article className="card">
          <p>No tienes permiso para gestionar solicitudes.</p>
        </article>
      </section>
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("account_requests")
    .select(
      "id, email, nombres, apellidos, cedula, celular, carrera, rol_solicitado, status, created_at"
    )
    .order("created_at", { ascending: false });

  const [{ count: totalSolicitudes = 0 }, { count: pendientes = 0 }] = await Promise.all([
    admin.from("account_requests").select("*", { head: true, count: "exact" }),
    admin.from("account_requests").select("*", { head: true, count: "exact" }).eq("status", "pendiente")
  ]);

  const rows = data || [];

  return (
    <section className="stack">
      <PageHeader
        title="Solicitudes de cuenta"
        subtitle={
          puedeAceptar
            ? "Acepta solicitudes para crear el usuario y enviar correo con clave temporal, o rechaza las que no correspondan."
            : "Revisa y rechaza solicitudes que no correspondan."
        }
      />

      {error ? (
        <article className="card">
          <div className="alert alert--error" role="alert">
            No se pudieron cargar las solicitudes. {error.message}
          </div>
        </article>
      ) : null}
      {!error && rows.length === 0 && (totalSolicitudes ?? 0) > 0 ? (
        <article className="card" style={{ borderLeft: "4px solid var(--color-warning)" }}>
          <p className="field-hint" style={{ margin: 0 }}>
            Se detectaron {totalSolicitudes} registros en BD ({pendientes} pendientes), pero no se renderizaron en esta
            vista. Reinicia el servidor y recarga con Ctrl+F5.
          </p>
        </article>
      ) : null}

      <SolicitudesCuentaTable
        rows={rows}
        puedeAceptar={puedeAceptar}
        puedeRechazar={esDecano || esSecretaria || esSuper}
        comentarioRechazoObligatorio={esSecretaria}
      />
    </section>
  );
}
