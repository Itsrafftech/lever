"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/ui/ErrorState";

export interface PageErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
}

/**
 * Shared body for every `error.tsx` segment file. Keeps the recovery UI
 * identical across pages and ensures the raw error only ever reaches the
 * console, never the rendered output.
 */
export function PageErrorBoundary({
  error,
  reset,
  title,
  message,
}: PageErrorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    // Next.js already reports this server-side; this keeps the client trace
    // available to the developer without rendering it.
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  function retry() {
    setAttempted(true);
    // `reset()` alone re-renders from the router cache, which still holds the
    // failed payload. Invalidating it first is what actually re-fetches.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <ErrorState
      title={title}
      message={message}
      digest={error.digest}
      busy={pending}
      hint={
        attempted && !pending
          ? "Masih gagal. Periksa koneksi, lalu coba lagi beberapa saat lagi."
          : undefined
      }
      onRetry={retry}
    />
  );
}
