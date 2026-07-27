"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface UserMenuProps {
  name: string | null;
  email: string;
  image: string | null;
}

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius)] p-1 pr-2",
          "transition-colors duration-150 hover:bg-[var(--bg-subtle)] lever-focus-ring",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-7 w-7 rounded-full border border-[var(--border)] object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-sunken)] text-[0.75rem] font-medium text-[var(--text-secondary)]"
          >
            {initials(name, email)}
          </span>
        )}
        <span className="hidden max-w-[10rem] truncate text-[0.8125rem] text-[var(--text-secondary)] sm:inline">
          {name || email}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden",
            "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)]",
            "shadow-card animate-fade-in",
          )}
        >
          <div className="border-b border-[var(--border)] px-3 py-2.5">
            <p className="truncate text-[0.875rem] font-medium">
              {name || "Tanpa nama"}
            </p>
            <p className="truncate text-[0.8125rem] text-[var(--text-muted)]">
              {email}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/settings/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-8 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-[0.875rem] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <UserIcon className="h-4 w-4" aria-hidden />
              Profil
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-8 items-center gap-2 rounded-[var(--radius-sm)] px-2 text-[0.875rem] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Settings className="h-4 w-4" aria-hidden />
              Pengaturan
            </Link>
          </div>

          <div className="border-t border-[var(--border)] p-1">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                void signOut({ callbackUrl: "/auth/signin" });
              }}
              className="flex h-8 w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 text-[0.875rem] text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--danger)] disabled:text-[var(--text-disabled)]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              {signingOut ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
