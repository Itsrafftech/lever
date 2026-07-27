"use client";

import { cn } from "@/lib/utils";

export interface TimerDisplayProps {
  /** Seconds remaining; may go negative once the session overruns. */
  remainingSecs: number;
  totalSecs: number;
  paused?: boolean;
  className?: string;
}

function format(totalSeconds: number): string {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  const body = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return negative ? `+${body}` : body;
}

export function TimerDisplay({
  remainingSecs,
  totalSecs,
  paused,
  className,
}: TimerDisplayProps) {
  const overrun = remainingSecs < 0;
  const elapsed = totalSecs - remainingSecs;
  const progress = totalSecs > 0 ? Math.min(100, (elapsed / totalSecs) * 100) : 0;

  const size = 260;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--bg-sunken)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            overrun ? "stroke-[var(--success)]" : "stroke-[var(--accent)]",
          )}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          role="timer"
          aria-live="off"
          className={cn(
            "font-mono text-[3.25rem] font-medium leading-none tabular-nums",
            overrun ? "text-[var(--success)]" : "text-[var(--text-primary)]",
            paused && "opacity-50",
          )}
        >
          {format(remainingSecs)}
        </span>
        <span className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">
          {paused
            ? "Dijeda"
            : overrun
              ? "Waktu habis — lanjut atau selesaikan"
              : `dari ${Math.round(totalSecs / 60)} menit`}
        </span>
      </div>
    </div>
  );
}
