import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  loading?: boolean;
  className?: string;
}

export function StatTile({
  label,
  value,
  hint,
  loading,
  className,
}: StatTileProps) {
  return (
    <div className={cn("lever-card p-4", className)}>
      <p className="text-[0.8125rem] text-[var(--text-secondary)]">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <p className="mt-1 font-mono text-[1.5rem] font-medium leading-tight text-[var(--text-primary)]">
          {value}
        </p>
      )}
      {hint ? (
        <p className="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
