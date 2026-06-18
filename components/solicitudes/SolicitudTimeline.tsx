import type { TimelineEvent } from "@/lib/solicitud-timeline";

type Props = Readonly<{ events: TimelineEvent[] }>;

function iconFor(event: TimelineEvent): string {
  if (event.id === "creada") return "📋";
  if (event.id === "final" && event.status === "rejected") return "✕";
  if (event.id === "final" && event.status === "completed") return "✓";
  if (event.id === "revision_secretaria") return "🔍";
  if (event.id === "revision_decano") return "✍";
  if (event.status === "pending") return "○";
  return "↪";
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "Pendiente";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SolicitudTimeline({ events }: Props) {
  return (
    <div className="tramite-timeline" role="list" aria-label="Fases del trámite">
      <p className="field-hint" style={{ margin: "0 0 0.75rem" }}>
        Flujo completo del trámite. La fase actual está resaltada.
      </p>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const lineClass =
          event.status === "rejected"
            ? "tramite-timeline__line tramite-timeline__line--rejected"
            : event.status === "completed" || event.status === "current"
              ? "tramite-timeline__line tramite-timeline__line--done"
              : "tramite-timeline__line";

        return (
          <div
            key={event.id}
            role="listitem"
            className={`tramite-timeline__item tramite-timeline__item--${event.status}${isLast ? " tramite-timeline__item--last" : ""}`}
          >
            <div className="tramite-timeline__track">
              {!isLast ? <div className={lineClass} aria-hidden /> : null}
              <span
                className={`tramite-timeline__dot tramite-timeline__dot--${event.status}`}
                aria-hidden
              />
            </div>
            <div className="tramite-timeline__icon" aria-hidden>
              {iconFor(event)}
            </div>
            <div className="tramite-timeline__body">
              <div className="tramite-timeline__label-row">
                <p className="tramite-timeline__label">Estado trámite: {event.label}</p>
                {event.status === "current" ? (
                  <span className="tramite-timeline__badge">Fase actual</span>
                ) : null}
                {event.status === "pending" ? (
                  <span className="tramite-timeline__badge tramite-timeline__badge--pending">Pendiente</span>
                ) : null}
              </div>
              <p className="tramite-timeline__fecha">Fecha: {formatDisplayDate(event.fecha)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
