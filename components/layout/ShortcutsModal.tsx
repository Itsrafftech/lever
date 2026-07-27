"use client";

import { Modal } from "@/components/ui/Modal";
import { SHORTCUT_DOCS } from "@/lib/nav";
import { useUiStore } from "@/lib/store/ui";

export function ShortcutsModal() {
  const open = useUiStore((state) => state.shortcutsOpen);
  const close = useUiStore((state) => state.closeShortcuts);

  if (!open) return null;

  return (
    <Modal
      open
      title="Pintasan keyboard"
      description="Berlaku di mana saja kecuali saat kursor berada di dalam kolom isian."
      onClose={close}
    >
      <div className="space-y-5">
        {SHORTCUT_DOCS.map((group) => (
          <div key={group.group}>
            <h3 className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {group.group}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li
                  key={item.description}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 flex-1 text-[0.875rem] text-[var(--text-secondary)]">
                    {item.description}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[0.75rem] text-[var(--text-secondary)]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
