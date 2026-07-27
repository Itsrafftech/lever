import { create } from "zustand";

import { clientId } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs: number;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = clientId();
    set((state) => ({
      toasts: [
        ...state.toasts,
        { durationMs: toast.tone === "error" ? 6000 : 4000, ...toast, id },
      ].slice(-4),
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Imperative helper so call sites read as `toast.error("...")`. */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "success", title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "error", title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: "info", title, description }),
  action: (
    title: string,
    action: { label: string; onClick: () => void },
    description?: string,
  ) =>
    useToastStore
      .getState()
      .push({ tone: "info", title, description, action }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
