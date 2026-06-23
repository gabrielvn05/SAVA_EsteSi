import { actualizarSolicitud } from "@/app/actions";
import { getUserProfile, requireAuth } from "@/lib/auth";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { isoDateUTC, threeMonthsAgoUTC } from "@/lib/fechas";
import { fetchSolicitudParaUsuario } from "@/lib/solicitud-access";
import { anexosDesdeDetalle } from "@/lib/solicitud-anexos";

type Params = { id: string };

export default async function EditarSolicitudPage({ params }: Readonly<{ params: Params }>) {
  const { user } = await requireAuth();
  const profile = await getUserProfile(user.id);
  const esStaff =
    profile.rol === "secretaria" || profile.rol === "decano" || profile.rol === "superusuario";
  const minFechaInicio = isoDateUTC(threeMonthsAgoUTC());
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const data = await fetchSolicitudParaUsuario(
    params.id,
    user.id,
    esStaff,
    "id, tipo, fecha_inicio, fecha_fin, motivo, justificativo_nombre, detalle, creado_por, estado"
  );

  if (!data) {
    return (
      <section className="card">
        <p>Solicitud no encontrada.</p>
      </section>
    );
  }

  if (data.estado !== "en_revision_secretaria") {
    return (
      <section className="card stack">
        <p>Esta solicitud ya no puede editarse porque avanzó en el proceso de aprobación.</p>
        <Link href={`/solicitudes/${params.id}`} className="btn btn--secondary">
          Ver detalle
        </Link>
      </section>
    );
  }

  const anexos = anexosDesdeDetalle((data.detalle as Record<string, unknown> | null) ?? null, supabaseBase);
  const updateAction = actualizarSolicitud.bind(null, params.id);

  return (
    <section className="stack">
      <PageHeader
        title="Editar solicitud"
        subtitle="Actualiza los datos o agrega documentos de respaldo adicionales."
        actions={
          <Link href={`/solicitudes/${params.id}`} className="btn btn--secondary">
            Ver detalle
          </Link>
        }
      />
      <article className="card stack" style={{ maxWidth: 720 }}>
        <form action={updateAction} className="stack" encType="multipart/form-data">
          <div>
            <label htmlFor="tipo">Tipo de tramite</label>
            <select id="tipo" name="tipo" required defaultValue={data.tipo}>
              <option value="justificacion">Justificacion</option>
              <option value="viaje">Por viaje</option>
              <option value="enfermedad">Por enfermedad</option>
              <option value="calamidad_domestica">Calamidad domestica</option>
              <option value="falta_marcado">Reporte de novedad en marcación</option>
              <option value="permiso">Permiso</option>
            </select>
          </div>
          <div className="form-grid form-grid--2">
            <div>
              <label htmlFor="fecha_inicio">Fecha inicio</label>
              <input
                id="fecha_inicio"
                name="fecha_inicio"
                type="date"
                required
                min={minFechaInicio}
                defaultValue={data.fecha_inicio}
              />
              <p className="field-hint">Máximo 3 meses hacia atrás (mínimo permitido: {minFechaInicio}).</p>
            </div>
            <div>
              <label htmlFor="fecha_fin">Fecha fin</label>
              <input id="fecha_fin" name="fecha_fin" type="date" required defaultValue={data.fecha_fin} />
            </div>
          </div>
          <div>
            <label htmlFor="motivo">Motivo y detalle</label>
            <textarea id="motivo" name="motivo" rows={5} required defaultValue={data.motivo} />
          </div>

          <div className="stack" style={{ gap: "0.5rem" }}>
            <p className="field-hint" style={{ margin: 0 }}>
              <strong>Oficio institucional (Word):</strong> {data.justificativo_nombre ?? "—"}
            </p>
            <p className="field-hint" style={{ margin: 0 }}>
              El oficio generado no se reemplaza al subir archivos. Para quitarlo o cambiarlo, use la opción en el
              detalle de la solicitud.
            </p>
            {anexos.length > 0 ? (
              <ul className="field-hint" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {anexos.map((a) => (
                  <li key={a.path}>{a.nombre}</li>
                ))}
              </ul>
            ) : (
              <p className="field-hint" style={{ margin: 0 }}>
                Sin documentos de respaldo adicionales.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="anexos">Agregar documentos de respaldo (opcional)</label>
            <p className="field-hint">PDF, PNG o JPG. Se añaden al trámite sin reemplazar el oficio Word.</p>
            <input id="anexos" className="file-input" name="anexos" type="file" multiple accept=".pdf,.png,.jpg,.jpeg" />
          </div>
          <div className="row">
            <button className="btn btn--primary" type="submit">
              Guardar cambios
            </button>
            <Link href={`/solicitudes/${params.id}`} className="btn btn--secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}
