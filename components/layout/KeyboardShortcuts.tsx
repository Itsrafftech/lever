"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PRIMARY_NAV } from "@/lib/nav";
import { isTypingTarget, useUiStore } from "@/lib/store/ui";

/**
 * Single global key handler. Plain-key bindings are ignored while the user is
 * typing or holding a modifier, so they never eat real input.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const togglePalette = useUiStore((state) => state.togglePalette);
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  const openShortcuts = useUiStore((state) => state.openShortcuts);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl/Cmd+K works even from inside a field — it is how you escape one.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      // Any overlay is open: let that surface own the keyboard.
      const { paletteOpen, quickAddOpen, shortcutsOpen } = useUiStore.getState();
      if (paletteOpen || quickAddOpen || shortcutsOpen) return;

      const key = event.key;

      if (key === "?") {
        event.preventDefault();
        openShortcuts();
        return;
      }

      if (key === "n" || key === "N") {
        event.preventDefault();
        openQuickAdd();
        return;
      }

      if (key === "f" || key === "F") {
        event.preventDefault();
        router.push("/focus");
        return;
      }

      const target = PRIMARY_NAV.find((item) => item.shortcut === key);
      if (target) {
        event.preventDefault();
        router.push(target.href);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, togglePalette, openQuickAdd, openShortcuts]);

  return null;
}
