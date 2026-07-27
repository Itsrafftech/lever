import { create } from "zustand";

interface UiState {
  paletteOpen: boolean;
  quickAddOpen: boolean;
  shortcutsOpen: boolean;

  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  openQuickAdd: () => void;
  closeQuickAdd: () => void;

  openShortcuts: () => void;
  closeShortcuts: () => void;
}

/**
 * Overlay state lives here so a global key handler can drive surfaces that are
 * rendered far away in the tree. Only one overlay is open at a time.
 */
export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  quickAddOpen: false,
  shortcutsOpen: false,

  openPalette: () =>
    set({ paletteOpen: true, quickAddOpen: false, shortcutsOpen: false }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () =>
    set((state) => ({
      paletteOpen: !state.paletteOpen,
      quickAddOpen: false,
      shortcutsOpen: false,
    })),

  openQuickAdd: () =>
    set({ quickAddOpen: true, paletteOpen: false, shortcutsOpen: false }),
  closeQuickAdd: () => set({ quickAddOpen: false }),

  openShortcuts: () =>
    set({ shortcutsOpen: true, paletteOpen: false, quickAddOpen: false }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
}));

/** True when the event target is a field that should swallow plain keys. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}
