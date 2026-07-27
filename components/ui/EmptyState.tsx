import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** One line. Illustration-free by design — the text carries the meaning. */
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-10 text-center",
        className,
      )}
    >
      <p className="max-w-[34ch] text-[0.875rem] text-[var(--text-muted)]">
        {message}
      </p>
      {action}
    </div>
  );
}
