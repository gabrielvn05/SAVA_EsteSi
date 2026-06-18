import Link from "next/link";
import { SolicitarCuentaForm } from "@/components/account/SolicitarCuentaForm";

type PageProps = Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
}>;

function avisoText(aviso: string | undefined, detalle?: string | undefined) {
  if (aviso === "usuario_existe") {
    return "Este correo ya está registrado en el sistema. Inicia sesión o usa otro correo institucional.";
  }
  if (aviso === "solicitud_pendiente") {
    return "Ya existe una solicitud de cuenta pendiente de aprobación para este correo. Espera la respuesta del Decano o contacta a Secretaría.";
  }
  if (aviso === "datos_incompletos") {
    return "Completa todos los campos obligatorios: nombres, apellidos, cédula, celular, correo institucional y carrera.";
  }
  if (aviso === "cedula_invalida") {
    return "La cédula de identidad debe tener entre 10 y 13 dígitos.";
  }
  if (aviso === "celular_invalido") {
    return "Indica un número de celular válido (mínimo 9 dígitos).";
  }
  if (aviso === "carrera_invalida") {
    return "Selecciona una carrera válida de la lista.";
  }
  if (aviso === "rol_invalido") {
    return "Selecciona un rol válido de la lista.";
  }
  if (aviso === "correo_invalido") {
    return "Indica un correo electrónico válido que incluya @.";
  }
  if (aviso === "error") {
    if (detalle && /carrera|cedula|celular|jornada/i.test(detalle) && /schema cache|column/i.test(detalle)) {
      return "La base de datos aún no tiene las columnas nuevas de solicitud de cuenta. El administrador debe ejecutar el archivo sql/007-account-requests-campos.sql en el editor SQL de Supabase (o npm run db:migrate-account-requests con DATABASE_URL configurado).";
    }
    return detalle ? `No se pudo enviar la solicitud: ${detalle}` : "No se pudo enviar la solicitud. Intenta de nuevo más tarde.";
  }
  return null;
}

export default function SolicitarCuentaPage({ searchParams }: PageProps) {
  const avisoParam = typeof searchParams.aviso === "string" ? searchParams.aviso : undefined;
  const detalleParam = typeof searchParams.detalle === "string" ? searchParams.detalle : undefined;
  const mensaje = avisoText(avisoParam, detalleParam ? decodeURIComponent(detalleParam) : undefined);

  return (
    <div className="login-page">
      <aside className="login-hero">
        <span className="login-hero__badge">Acceso institucional</span>
        <img
          src="/branding/LOGO-ULEAM-HORIZONTAL.png"
          alt="ULEAM"
          style={{ maxWidth: 450, width: "100%", height: "auto" }}
        />
        <h1>Solicitar cuenta</h1>
        <p>
          Si trabajas o colaboras con la facultad y aún no tienes acceso, envía tu solicitud con tus datos
          institucionales. El Decanato la revisará y, si corresponde, se creará tu usuario.
        </p>
      </aside>
      <div className="login-panel">
        <div className="card stack" style={{ width: "100%", maxWidth: 760 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Datos de la solicitud</h2>
            <p className="field-hint" style={{ margin: "0.4rem 0 0" }}>
              Todos los campos marcados con * son obligatorios. Usa tu correo institucional.
            </p>
          </div>

          <p className="field-hint" style={{ margin: "-0.25rem 0 0" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ fontWeight: 600 }}>
              Inicia sesión aquí
            </Link>
            .
          </p>

          <SolicitarCuentaForm mensajeError={mensaje} />
        </div>
      </div>
    </div>
  );
}
