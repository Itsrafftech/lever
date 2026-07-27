"use client";

import { AlertTriangle, CalendarDays, ExternalLink, Timer } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatDuration, formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { CalendarEventDTO } from "@/lib/hooks/useCalendar";
import type { FocusSessionDTO } from "@/types/api";

/** Overlaps shorter than this are treated as harmless adjacency. */
export const CONFLICT_THRESHOLD_MINS = 5;

export interface TimelineEntry {
  id: string;
  kind: "session" | "event";
  title: string;
  start: string;
  end: string;
  durationMins: number;
  status?: string;
  htmlLink?: string | null;
  allDay?: boolean;
}

export function sessionsToEntries(sessions: FocusSessionDTO[]): TimelineEntry[] {
  return sessions.map((session) => {
    const start = session.actualStart ?? session.plannedStart;
    const end =
      session.completedAt ??
      session.abandonedAt ??
      new Date(
        new Date(start).getTime() + session.durationMins * 60_000,
      ).toISOString();

    // Show the span the row actually occupies, not the planned duration — a
    // 25-minute block abandoned after 2 minutes should not read as 25m.
    const spanMins = Math.max(
      1,
      Math.round(
        (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
      ),
    );

    return {
      id: session.id,
      kind: "session" as const,
      title: session.task?.title ?? "Sesi fokus",
      start,
      end,
      durationMins: spanMins,
      status: session.status,
    };
  });
}

export function eventsToEntries(
  events: CalendarEventDTO[],
  dayStart: Date,
  dayEnd: Date,
): TimelineEntry[] {
  return events
    .filter((event) => {
      // Only events touching the current day belong on this timeline, and
      // LEVER's own events are already represented by the session rows.
      if (event.isLever) return false;
      const start = new Date(event.start);
      const end = new Date(event.end);
      return start < dayEnd && end > dayStart;
    })
    .map((event) => ({
      id: `event-${event.id}`,
      kind: "event" as const,
      title: event.summary,
      start: event.start,
      end: event.end,
      durationMins: Math.max(
        0,
        Math.round(
          (new Date(event.end).getTime() - new Date(event.start).getTime()) /
            60_000,
        ),
      ),
      htmlLink: event.htmlLink,
      allDay: event.allDay,
    }));
}

/** Minutes of overlap between two intervals; 0 when they do not intersect. */
function overlapMinutes(a: TimelineEntry, b: TimelineEntry): number {
  const start = Math.max(new Date(a.start).getTime(), new Date(b.start).getTime());
  const end = Math.min(new Date(a.end).getTime(), new Date(b.end).getTime());
  return end <= start ? 0 : Math.round((end - start) / 60_000);
}

export interface Conflict {
  minutes: number;
  eventTitle: string;
}

/** Maps each session entry id to its worst calendar-event clash. */
export function findConflicts(entries: TimelineEntry[]): Map<string, Conflict> {
  const sessions = entries.filter((entry) => entry.kind === "session");
  const events = entries.filter(
    (entry) => entry.kind === "event" && !entry.allDay,
  );

  const conflicts = new Map<string, Conflict>();

  for (const session of sessions) {
    for (const event of events) {
      const minutes = overlapMinutes(session, event);
      if (minutes <= CONFLICT_THRESHOLD_MINS) continue;

      const existing = conflicts.get(session.id);
      if (!existing || minutes > existing.minutes) {
        conflicts.set(session.id, { minutes, eventTitle: event.title });
      }
    }
  }

  return conflicts;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border-l-[var(--accent)]",
  COMPLETED: "border-l-[var(--success)]",
  ABANDONED: "border-l-[var(--warning)]",
};

export function DayTimeline({
  entries,
  timezone,
}: {
  entries: TimelineEntry[];
  timezone: string;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState message="Belum ada sesi atau acara hari ini. Blok waktu yang konkret lebih mungkin dijalankan daripada niat umum." />
    );
  }

  const conflicts = findConflicts(entries);

  const sorted = [...entries].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  return (
    <ul className="space-y-1.5 p-3">
      {sorted.map((entry) => {
        const conflict = conflicts.get(entry.id);
        const isEvent = entry.kind === "event";

        return (
          <li key={entry.id}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] border border-l-2 px-3 py-2",
                isEvent
                  ? // Imported events are read-only: muted, dashed, no accent.
                    "border-dashed border-[var(--border)] border-l-[var(--border-strong)] bg-[var(--bg-subtle)]"
                  : cn(
                      "border-[var(--border)] bg-[var(--bg-surface)]",
                      entry.status
                        ? STATUS_STYLES[entry.status]
                        : "border-l-[var(--border-strong)]",
                    ),
              )}
            >
              <span
                className={cn(
                  "shrink-0 font-mono text-[0.8125rem]",
                  isEvent
                    ? "text-[var(--text-muted)]"
                    : "text-[var(--text-secondary)]",
                )}
              >
                {entry.allDay
                  ? "—"
                  : formatTime(new Date(entry.start), timezone)}
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[0.875rem]",
                  isEvent ? "text-[var(--text-secondary)]" : undefined,
                )}
              >
                {entry.title}
              </span>

              {isEvent && entry.htmlLink ? (
                <a
                  href={entry.htmlLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Buka ${entry.title} di Google Calendar`}
                  className="shrink-0 text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : null}

              <span className="flex shrink-0 items-center gap-1 text-[0.75rem] text-[var(--text-muted)]">
                {isEvent ? (
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Timer className="h-3.5 w-3.5" aria-hidden />
                )}
                {entry.allDay ? "seharian" : formatDuration(entry.durationMins)}
              </span>
            </div>

            {conflict ? (
              <p className="mt-1 flex items-start gap-1.5 pl-3 text-[0.75rem] text-[var(--warning)]">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                Bentrok {conflict.minutes} menit dengan &ldquo;{conflict.eventTitle}
                &rdquo; di Google Calendar.
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
