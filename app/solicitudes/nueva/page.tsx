import dynamic from "next/dynamic";
import { requireAuth } from "@/lib/auth";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const JustificacionWizard = dynamic(
  () =>
    import("@/components/solicitudes/JustificacionWizard").then((m) => ({
      default: m.JustificacionWizard
    })),
  {
    loading: () => <LoadingOverlay label="Preparando formulario…" contained />
  }
);

export default async function NuevaSolicitudPage() {
  await requireAuth();
  return <JustificacionWizard />;
}
