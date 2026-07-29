import { STATUS_CHART_COLORS, type SaleStatus } from "@/data/sales";
import { TicketIcon, UsersIcon, StarIcon } from "@/components/ui/Icons";

export interface ActivityEvent {
  type: "sale" | "user" | "testimonial";
  status: SaleStatus | null;
  label: string;
  timestamp: string;
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function dotColor(event: ActivityEvent) {
  if (event.type === "sale" && event.status) return STATUS_CHART_COLORS[event.status];
  if (event.type === "user") return "#0f3fb0";
  return "#cc9a2e";
}

function EventIcon({ event }: { event: ActivityEvent }) {
  const className = "h-4 w-4";
  if (event.type === "user") return <UsersIcon className={className} />;
  if (event.type === "testimonial") return <StarIcon className={className} />;
  return <TicketIcon className={className} />;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm font-medium text-admin-text-muted">
        Aún no hay actividad reciente.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {events.map((event, i) => (
        <li key={i} className="flex items-center gap-3 rounded-admin-md px-2 py-2.5 transition-colors hover:bg-admin-bg">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: dotColor(event) }}
          >
            <EventIcon event={event} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-admin-text">{event.label}</span>
          <span className="shrink-0 text-xs font-medium text-admin-text-muted">
            {relativeTime(event.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
