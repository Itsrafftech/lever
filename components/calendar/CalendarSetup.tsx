"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Globe, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { ReconnectBanner } from "@/components/calendar/ReconnectBanner";
import { formatShortDate, formatTime } from "@/lib/date";
import { ApiRequestError, describeError, mutateJson } from "@/lib/fetcher";
import { triggerSync, useCalendars } from "@/lib/hooks/useCalendar";
import { toast } from "@/lib/store/toast";

export function CalendarSetup({ timezone }: { timezone: string }) {
  const { calendars, status, isLoading, error, mutate } = useCalendars();

  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const needsReconnect =
    Boolean(status?.needsReconnect) ||
    (error instanceof ApiRequestError && error.code === "RECONNECT_REQUIRED");

  async function patchSettings(patch: Record<string, unknown>) {
    setSaving(true);
    try {
      await mutateJson("/api/settings", "PATCH", patch);
      await mutate();
    } catch (cause) {
      toast.error("Pengaturan kalender gagal disimpan", describeError(cause));
    } finally {
      setSaving(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    try {
      const result = await triggerSync();
      toast.success(
        "Sinkronisasi selesai",
        result.created > 0
          ? `${result.created} sesi ditambahkan ke Google Calendar.`
          : "Semua sesi sudah tersinkron.",
      );
      await mutate();
    } catch (cause) {
      toast.error("Sinkronisasi gagal", describeError(cause));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="lever-card p-5">
      <h2 className="text-[1.125rem] font-semibold">Google Calendar</h2>
      <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
        Sesi fokus muncul sebagai acara, dan acara kalender muncul di timeline
        dashboard.
      </p>

      {/* A rejected grant can arrive either in the payload or as a 401, and in
          both cases retrying is pointless — only a fresh consent helps. */}
      {needsReconnect ? (
        <ReconnectBanner show className="mt-4" callbackUrl="/settings" />
      ) : null}

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : error && !needsReconnect ? (
        <div className="mt-4">
          <p className="text-[0.875rem] text-[var(--danger)]">
            {describeError(error)}
          </p>
          <Button className="mt-3" size="sm" variant="ghost" onClick={() => mutate()}>
            Coba lagi
          </Button>
        </div>
      ) : needsReconnect ? null : !status?.connected ? (
        <div className="mt-4">
          <p className="text-[0.875rem] text-[var(--text-secondary)]">
            Belum terhubung. Menghubungkan akan meminta izin membaca dan menulis
            acara kalender.
          </p>
          <Button
            className="mt-3"
            variant="ghost"
            loading={connecting}
            icon={<Globe className="h-[18px] w-[18px]" aria-hidden />}
            onClick={() => {
              setConnecting(true);
              void signIn("google", { callbackUrl: "/settings" });
            }}
          >
            Hubungkan Google Calendar
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Select
            label="Kalender tujuan"
            value={status.calendarId ?? ""}
            placeholder="Pilih kalender…"
            disabled={saving || calendars.length === 0}
            onChange={(value) => patchSettings({ googleCalendarId: value })}
            options={calendars.map((calendar) => ({
              value: calendar.id,
              label: calendar.summary,
              description: calendar.primary ? "Kalender utama" : undefined,
            }))}
            hint={
              calendars.length === 0
                ? "Tidak ada kalender yang bisa ditulisi di akun Google ini."
                : undefined
            }
          />

          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <Toggle
              checked={status.syncSessions}
              disabled={saving}
              label="Sync sesi fokus ke kalender"
              description="Setiap sesi yang dimulai dibuatkan acara bertanda [LEVER]."
              onChange={(value) =>
                patchSettings({ syncSessionsToCalendar: value })
              }
            />
            <Toggle
              checked={status.importEvents}
              disabled={saving}
              label="Import acara dari kalender"
              description="Acara 7 hari ke depan tampil read-only di timeline."
              onChange={(value) => patchSettings({ importCalendarEvents: value })}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <p className="text-[0.8125rem] text-[var(--text-muted)]">
              {status.lastSyncedAt ? (
                <>
                  Terakhir disinkron{" "}
                  <span className="font-mono text-[var(--text-secondary)]">
                    {formatShortDate(new Date(status.lastSyncedAt), timezone)}{" "}
                    {formatTime(new Date(status.lastSyncedAt), timezone)}
                  </span>
                </>
              ) : (
                "Belum pernah disinkron manual."
              )}
            </p>

            <Button
              size="sm"
              variant="ghost"
              loading={syncing}
              disabled={!status.calendarId || status.needsReconnect}
              icon={<RefreshCw className="h-4 w-4" aria-hidden />}
              onClick={runSync}
            >
              Sinkronkan sekarang
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
