import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/steel-formula";

const TONES = {
  danger:
    "border-[color:var(--danger)]/25 bg-[var(--danger-bg)] text-[var(--danger)]",
  warning:
    "border-[color:var(--warning)]/25 bg-[var(--warning-bg)] text-[var(--warning)]",
  success:
    "border-[color:var(--success)]/25 bg-[var(--success-bg)] text-[var(--success)]",
};

export function SteelScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tone = scoreTone(score);
  return (
    <span
      title={`Skor motivasi ${score} dari 100`}
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border px-1.5",
        "font-mono text-[0.75rem] leading-5",
        TONES[tone],
        className,
      )}
    >
      {score}
    </span>
  );
}
