"use client";

import { useEffect, useState } from "react";
import { Check, Pause, Play, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TimerDisplay } from "@/components/sessions/TimerDisplay";
import { describeError } from "@/lib/fetcher";
import { abandonSession } from "@/lib/hooks/useSessions";
import { formatSeconds } from "@/lib/date";
import { toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils";
import type { FocusSessionDTO } from "@/types/api";

const PAUSE_REASONS = [
  "Gangguan",
  "Istirahat sebentar",
  "Lainnya",
] as const;

export interface FocusModeProps {
  session: FocusSessionDTO;
  onFinish: (session: FocusSessionDTO) => void;
  onAbandoned: () => void;
}

export function FocusMode({ session, onFinish, onAbandoned }: FocusModeProps) {
  const totalSecs = session.durationMins * 60;

  const [remaining, setRemaining] = useState(() => computeRemaining(session, 0));
  const [paused, setPaused] = useState(false);
  const [pausedSecs, setPausedSecs] = useState(0);
  const [pausePrompt, setPausePrompt] = useState(false);
  const [abandonPrompt, setAbandonPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  // The countdown is derived from actualStart, so a refresh or a backgrounded
  // tab never drifts — only paused time is accumulated locally.
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setRemaining(computeRemaining(session, pausedSecs));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, paused, pausedSecs]);

  useEffect(() => {
    if (!paused) return;
    const timer = window.setInterval(() => setPausedSecs((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused]);

  // Warn before a reload would orphan the running session.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  async function abandon(notes?: string) {
    setBusy(true);
    try {
      await abandonSession(session.id, notes);
      toast.info(
        "Sesi ditinggalkan",
        "Waktu yang sudah berjalan tetap tercatat di analitik.",
      );
      onAbandoned();
    } catch (error) {
      toast.error("Sesi gagal ditutup", describeError(error));
    } finally {
      setBusy(false);
      setAbandonPrompt(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[var(--bg-page)] px-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="h-4 w-4" aria-hidden />}
          onClick={() => setAbandonPrompt(true)}
        >
          Tinggalkan
        </Button>
      </div>

      {session.timeToStartSecs !== null ? (
        <p className="mb-6 text-[0.8125rem] text-[var(--text-muted)]">
          Time-to-start:{" "}
          <span className="font-mono text-[var(--text-secondary)]">
            {formatSeconds(session.timeToStartSecs)}
          </span>
        </p>
      ) : null}

      <TimerDisplay
        remainingSecs={remaining}
        totalSecs={totalSecs}
        paused={paused}
      />

      <h1 className="mt-6 max-w-[46ch] text-center text-[1.125rem] font-semibold">
        {session.task?.title ?? "Sesi fokus tanpa tugas spesifik"}
      </h1>

      {session.intentionText ? (
        <p className="mt-3 max-w-[52ch] rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-4 py-2.5 text-center text-[0.875rem] leading-relaxed text-[var(--text-primary)]">
          {session.intentionText}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-2">
        <Button
          variant="ghost"
          size="lg"
          icon={
            paused ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <Pause className="h-4 w-4" aria-hidden />
            )
          }
          onClick={() => {
            if (paused) setPaused(false);
            else setPausePrompt(true);
          }}
        >
          {paused ? "Lanjutkan" : "Jeda"}
        </Button>

        <Button
          size="lg"
          icon={<Check className="h-4 w-4" aria-hidden />}
          onClick={() => onFinish(session)}
        >
          Selesai
        </Button>
      </div>

      {paused ? (
        <p className="mt-4 font-mono text-[0.8125rem] text-[var(--text-muted)]">
          Dijeda {formatSeconds(pausedSecs)}
        </p>
      ) : null}

      {pausePrompt ? (
        <Modal
          open
          size="sm"
          title="Kenapa dijeda?"
          description="Dicatat supaya kamu bisa melihat pola gangguan."
          onClose={() => setPausePrompt(false)}
        >
          <div className="space-y-2">
            {PAUSE_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  setPaused(true);
                  setPausePrompt(false);
                }}
                className={cn(
                  "w-full rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-left",
                  "text-[0.875rem] text-[var(--text-secondary)]",
                  "transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
                )}
              >
                {reason}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {abandonPrompt ? (
        <Modal
          open
          size="sm"
          title="Tutup sesi ini?"
          onClose={() => setAbandonPrompt(false)}
        >
          <div className="space-y-2">
            <Button
              fullWidth
              disabled={busy}
              onClick={() => {
                setAbandonPrompt(false);
                onFinish(session);
              }}
            >
              Tandai sebagai selesai
            </Button>
            <Button
              variant="ghost"
              fullWidth
              loading={busy}
              onClick={() => abandon("Lanjutkan nanti")}
            >
              Lanjutkan nanti
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={busy}
              onClick={() => abandon()}
            >
              Tinggalkan sesi
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function computeRemaining(session: FocusSessionDTO, pausedSecs: number): number {
  if (!session.actualStart) return session.durationMins * 60;
  const elapsed = Math.floor(
    (Date.now() - new Date(session.actualStart).getTime()) / 1000,
  );
  return session.durationMins * 60 - (elapsed - pausedSecs);
}
