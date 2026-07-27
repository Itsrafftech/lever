"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white border border-[var(--accent)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] disabled:bg-[var(--text-disabled)] disabled:border-[var(--text-disabled)]",
  ghost:
    "bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] disabled:text-[var(--text-disabled)]",
  danger:
    "bg-[var(--danger-bg)] text-[var(--danger)] border border-[color:var(--danger)]/25 hover:bg-[#FBE3E3] disabled:text-[var(--text-disabled)]",
  link: "bg-transparent border border-transparent text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline underline-offset-4 px-0",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.8125rem] gap-1.5",
  md: "h-9 px-4 text-[0.875rem] gap-2",
  lg: "h-11 px-5 text-[0.9375rem] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      icon,
      iconRight,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius)] font-medium",
          "transition-colors duration-150 lever-focus-ring",
          "disabled:cursor-not-allowed",
          VARIANTS[variant],
          variant === "link" ? "h-auto py-0" : SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          icon
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);
