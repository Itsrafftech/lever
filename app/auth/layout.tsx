import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)]">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-6 flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] font-mono text-[0.9375rem] font-medium text-white"
            >
              L
            </span>
            <span className="text-[1.125rem] font-semibold tracking-tight">
              LEVER
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
