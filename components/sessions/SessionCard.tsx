import { Star } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { formatDuration, formatSeconds, formatShortDate, formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { FocusSessionDTO } from "@/types/api";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Berjalan",
  COMPLETED: "Selesai",
  ABANDONED: "Ditinggalkan",
};

const STATUS_TONES = {
  ACTIVE: "accent",
  COMPLETED: "success",
  ABANDONED: "warning",
} as const;

export function SessionCard({
  session,
  timezone,
}: {
  session: FocusSessionDTO;
  timezone: string;
}) {
  const start = session.actualStart ?? session.plannedStart;

  return (
    <li className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.875rem] text-[var(--text-primary)]">
          {session.task?.title ?? "Sesi tanpa tugas spesifik"}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          <span className="font-mono">
            {formatShortDate(new Date(start), timezone)}{" "}
            {formatTime(new Date(start), timezone)}
          </span>
          <span>{formatDuration(session.durationMins)}</span>
          {session.timeToStartSecs !== null ? (
            <span
              className={cn(
                session.timeToStartSecs > 900 ? "text-[var(--warning)]" : undefined,
              )}
            >
              mulai +{formatSeconds(session.timeToStartSecs)}
            </span>
          ) : null}
        </p>
      </div>

      {session.rating ? (
        <span className="flex shrink-0 items-center gap-0.5 font-mono text-[0.8125rem] text-[var(--text-secondary)]">
          <Star className="h-3.5 w-3.5 fill-[var(--accent)] text-[var(--accent)]" aria-hidden />
          {session.rating}
        </span>
      ) : null}

      <Badge tone={STATUS_TONES[session.status]}>
        {STATUS_LABELS[session.status]}
      </Badge>
    </li>
  );
}
