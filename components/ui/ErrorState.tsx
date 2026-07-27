"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  /** Short, stable identifier Next.js attaches to server errors. */
  digest?: string;
  busy?: boolean;
  /** Extra line shown after a retry that did not resolve anything. */
  hint?: string;
}

/**
 * The only error UI users see. Stack traces and raw messages stay in the
 * server logs — surfacing them here would leak internals and help nobody.
 */
export function ErrorState({
  title = "Ada yang tidak beres",
  message = "Halaman ini gagal dimuat. Coba muat ulang — kalau masih gagal, tunggu sebentar lalu ulangi.",
  onRetry,
  digest,
  busy,
  hint,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="lever-card max-w-[420px] p-6 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--danger-bg)]">
          <AlertTriangle className="h-5 w-5 text-[var(--danger)]" aria-hidden />
        </span>

        <h1 className="mt-4 text-[1.125rem] font-semibold">{title}</h1>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
          {message}
        </p>

        <Button className="mt-5" loading={busy} onClick={onRetry}>
          Muat ulang
        </Button>

        {hint ? (
          <p className="mt-3 text-[0.8125rem] text-[var(--warning)]">{hint}</p>
        ) : null}

        {digest ? (
          <p className="mt-4 font-mono text-[0.75rem] text-[var(--text-muted)]">
            Kode: {digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
