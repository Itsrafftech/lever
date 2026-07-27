"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { UserMenu, type UserMenuProps } from "@/components/layout/UserMenu";
import { PRIMARY_NAV, SECONDARY_NAV, isNavActive } from "@/lib/nav";
import { useUiStore } from "@/lib/store/ui";

function currentTitle(pathname: string): string {
  const match = [...PRIMARY_NAV, ...SECONDARY_NAV].find((item) =>
    isNavActive(pathname, item.href),
  );
  return match?.label ?? "LEVER";
}

export function TopBar({ user }: { user: UserMenuProps }) {
  const pathname = usePathname();
  const openPalette = useUiStore((state) => state.openPalette);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link
          href="/dashboard"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] font-mono text-[0.8125rem] font-medium text-white md:hidden"
        >
          L
        </Link>
        <h1 className="truncate text-[1.125rem] font-semibold">
          {currentTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openPalette}
          aria-label="Buka command palette"
          className="hidden h-8 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-2.5 text-[0.8125rem] text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-secondary)] sm:flex"
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          Cari
          <kbd className="rounded-[4px] border border-[var(--border)] px-1 font-mono text-[0.6875rem]">
            Ctrl K
          </kbd>
        </button>

        <UserMenu {...user} />
      </div>
    </header>
  );
}
