"use client";

import useSWR from "swr";

import { fetcher, mutateJson } from "@/lib/fetcher";

export interface CalendarStatus {
  connected: boolean;
  needsReconnect: boolean;
  calendarId: string | null;
  lastSyncedAt: string | null;
  syncSessions: boolean;
  importEvents: boolean;
}

export interface CalendarOption {
  id: string;
  summary: string;
  description: string | null;
  primary: boolean;
  accessRole: string;
  timeZone: string | null;
}

export interface CalendarEventDTO {
  id: string;
  summary: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string | null;
  isLever: boolean;
}

export function useCalendars() {
  const { data, error, isLoading, mutate } = useSWR<{
    calendars: CalendarOption[];
    status: CalendarStatus;
  }>("/api/calendar/calendars", fetcher, { revalidateOnFocus: false });

  return {
    calendars: data?.calendars ?? [],
    status: data?.status,
    error,
    isLoading,
    mutate,
  };
}

export function useCalendarEvents(days = 7) {
  const { data, error, isLoading, mutate } = useSWR<{
    events: CalendarEventDTO[];
    status: CalendarStatus;
    error: { code: string; message: string } | null;
    skipped: boolean;
  }>(`/api/calendar/events?days=${days}`, fetcher, {
    revalidateOnFocus: false,
    // A calendar hiccup should not spam retries on every dashboard render.
    shouldRetryOnError: false,
  });

  return {
    events: data?.events ?? [],
    status: data?.status,
    calendarError: data?.error ?? null,
    skipped: data?.skipped ?? false,
    error,
    isLoading,
    mutate,
  };
}

export async function triggerSync(): Promise<{
  considered: number;
  created: number;
  failed: number;
  lastSyncedAt: string;
}> {
  return mutateJson("/api/calendar/sync", "POST");
}
