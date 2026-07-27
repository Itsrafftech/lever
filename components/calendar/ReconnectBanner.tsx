"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ReconnectBannerProps {
  /** Nothing renders unless the stored grant was actually rejected. */
  show: boolean;
  callbackUrl?: string;
  className?: string;
}

export function ReconnectBanner({
  show,
  callbackUrl = "/settings",
  className,
}: ReconnectBannerProps) {
  const [busy, setBusy] = useState(false);

  if (!show) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border p-4",
        "border-[color:var(--warning)]/25 bg-[var(--warning-bg)]",
        className,
      )}
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0 text-[var(--warning)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.875rem] font-medium">
          Kalender perlu dihubungkan ulang
        </p>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-secondary)]">
          Google menolak izin yang tersimpan. Sesi fokus tidak akan muncul di
          kalender sampai kamu memberi izin lagi.
        </p>
      </div>
      <Button
        size="sm"
        loading={busy}
        onClick={() => {
          setBusy(true);
          void signIn("google", { callbackUrl });
        }}
      >
        Hubungkan ulang
      </Button>
    </div>
  );
}
