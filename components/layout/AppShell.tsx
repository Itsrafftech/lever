"use client";

import type { ReactNode } from "react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { GlobalQuickAdd } from "@/components/layout/GlobalQuickAdd";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { MobileNav } from "@/components/layout/MobileNav";
import { ShortcutsModal } from "@/components/layout/ShortcutsModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { UserMenuProps } from "@/components/layout/UserMenu";

export function AppShell({
  user,
  children,
}: {
  user: UserMenuProps;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <Sidebar />

      <KeyboardShortcuts />
      <CommandPalette />
      <GlobalQuickAdd />
      <ShortcutsModal />

      <div className="md:pl-12 lg:pl-[var(--sidebar-width)]">
        <TopBar user={user} />
        <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-5 md:pb-10 lg:px-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
