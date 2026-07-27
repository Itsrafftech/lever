import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** 0-100. Values outside the range are clamped. */
  value: number;
  className?: string;
  size?: "sm" | "md";
  tone?: "accent" | "success";
  label?: string;
}

export function ProgressBar({
  value,
  className,
  size = "md",
  tone = "accent",
  label,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progres ${clamped} persen`}
      className={cn(
        "w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300 ease-out",
          tone === "accent" ? "bg-[var(--accent)]" : "bg-[var(--success)]",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
