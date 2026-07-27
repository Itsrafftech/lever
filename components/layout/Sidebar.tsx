"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV, isNavActive, type NavItem } from "@/lib/nav";

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-[var(--radius)] text-[0.875rem]",
        "transition-colors duration-150 lever-focus-ring",
        collapsed ? "h-9 w-9 justify-center" : "h-9 gap-2.5 px-2.5",
        active
          ? "bg-[var(--accent-subtle)] font-medium text-[var(--accent-hover)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <>
          <span className="truncate">{item.label}</span>
          {item.shortcut ? (
            <kbd
              className={cn(
                "ml-auto hidden rounded-[4px] border px-1 font-mono text-[0.6875rem] leading-4 xl:block",
                active
                  ? "border-[var(--accent-border)] text-[var(--accent-hover)]"
                  : "border-[var(--border)] text-[var(--text-muted)]",
              )}
            >
              {item.shortcut}
            </kbd>
          ) : null}
        </>
      )}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden shrink-0 flex-col border-r border-[var(--border)]",
        "bg-[var(--bg-surface)] md:flex",
        "w-12 lg:w-[var(--sidebar-width)]",
      )}
    >
      <div className="flex h-14 items-center border-b border-[var(--border)] px-2.5 lg:px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 lever-focus-ring rounded-[var(--radius-sm)]"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] font-mono text-[0.8125rem] font-medium text-white"
            aria-hidden
          >
            L
          </span>
          <span className="hidden text-[0.9375rem] font-semibold tracking-tight lg:inline">
            LEVER
          </span>
        </Link>
      </div>

      <nav
        aria-label="Navigasi utama"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1.5 lg:p-3"
      >
        <p className="mb-1 hidden px-2.5 text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--text-muted)] lg:block">
          Ruang kerja
        </p>
        {PRIMARY_NAV.map((item) => (
          <div key={item.href}>
            <span className="lg:hidden">
              <NavLink item={item} collapsed />
            </span>
            <span className="hidden lg:block">
              <NavLink item={item} collapsed={false} />
            </span>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-[var(--border)] p-1.5 lg:p-3">
        {SECONDARY_NAV.map((item) => (
          <div key={item.href}>
            <span className="lg:hidden">
              <NavLink item={item} collapsed />
            </span>
            <span className="hidden lg:block">
              <NavLink item={item} collapsed={false} />
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
