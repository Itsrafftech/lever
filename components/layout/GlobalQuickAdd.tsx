"use client";

import { useEffect, useRef, useState } from "react";
import { mutate as globalMutate } from "swr";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { describeError } from "@/lib/fetcher";
import { createTask } from "@/lib/hooks/useTasks";
import { toast } from "@/lib/store/toast";
import { useUiStore } from "@/lib/store/ui";

/** Task-shaped caches that must refresh after a global add. */
function revalidateTasks() {
  void globalMutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith("/api/tasks") ||
        key.startsWith("/api/analytics") ||
        key.startsWith("/api/checkins")),
    undefined,
    { revalidate: true },
  );
}

export function GlobalQuickAdd() {
  const open = useUiStore((state) => state.quickAddOpen);
  const close = useUiStore((state) => state.closeQuickAdd);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  async function save() {
    const trimmed = title.trim();
    if (trimmed.length < 2) return;

    setSaving(true);
    try {
      await createTask({ title: trimmed, priority: "MEDIUM" });
      toast.success("Tugas dibuat", trimmed);
      revalidateTasks();
      setTitle("");
      // Stay open so several tasks can be captured in one burst.
      inputRef.current?.focus();
    } catch (error) {
      toast.error("Tugas gagal dibuat", describeError(error));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Modal
      open
      size="sm"
      title="Tugas baru"
      description="Tulis satu langkah konkret. Detailnya bisa menyusul."
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Tutup
          </Button>
          <Button
            loading={saving}
            disabled={title.trim().length < 2}
            onClick={save}
          >
            Simpan
          </Button>
        </>
      }
    >
      <input
        ref={inputRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void save();
          }
        }}
        placeholder="Menulis paragraf pertama bab 3"
        aria-label="Judul tugas baru"
        className="h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-[0.875rem] outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]"
      />
      <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">
        Tekan Enter untuk menyimpan dan langsung menulis tugas berikutnya.
      </p>
    </Modal>
  );
}
