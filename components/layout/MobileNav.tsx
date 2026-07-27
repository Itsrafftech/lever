"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { MOBILE_NAV, isNavActive } from "@/lib/nav";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi mobile"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--border)]",
        "bg-[var(--bg-surface)] pb-[env(safe-area-inset-bottom)] md:hidden",
      )}
    >
      {MOBILE_NAV.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-1 transition-colors duration-150",
              active
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)] active:bg-[var(--bg-subtle)]",
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            <span className="text-[0.6875rem] leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
