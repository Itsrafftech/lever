import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-[var(--radius-sm)] animate-shimmer",
        "bg-[linear-gradient(90deg,var(--bg-subtle)_25%,var(--bg-sunken)_50%,var(--bg-subtle)_75%)]",
        "bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

/** Repeated text lines — the shape most lists degrade to while loading. */
export function SkeletonLines({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === count - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
