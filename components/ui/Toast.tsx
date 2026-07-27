"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastStore, type ToastItem, type ToastTone } from "@/lib/store/toast";

const TONE_STYLES: Record<ToastTone, { wrap: string; icon: string }> = {
  success: {
    wrap: "border-[color:var(--success)]/25 bg-[var(--success-bg)]",
    icon: "text-[var(--success)]",
  },
  error: {
    wrap: "border-[color:var(--danger)]/25 bg-[var(--danger-bg)]",
    icon: "text-[var(--danger)]",
  },
  info: {
    wrap: "border-[var(--border)] bg-[var(--bg-surface)]",
    icon: "text-[var(--text-secondary)]",
  },
};

const TONE_ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = TONE_ICONS[item.tone];
  const styles = TONE_STYLES[item.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), item.durationMs);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.id, item.durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-2.5 rounded-[var(--radius-lg)] border p-3",
        "shadow-card animate-toast-in",
        styles.wrap,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">
          {item.title}
        </p>
        {item.description ? (
          <p className="mt-0.5 text-[0.8125rem] text-[var(--text-secondary)]">
            {item.description}
          </p>
        ) : null}
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              dismiss(item.id);
            }}
            className="mt-1.5 text-[0.8125rem] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Tutup notifikasi"
        className="rounded-[var(--radius-sm)] p-0.5 text-[var(--text-muted)] transition-colors duration-150 hover:bg-black/5 hover:text-[var(--text-primary)]"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>
  );
}
