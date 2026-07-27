"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

export default function Error({ error, reset }: PageErrorProps) {
  return (
    <PageErrorBoundary
      error={error}
      reset={reset}
      title="Daftar tugas gagal dimuat"
      message="Tugas tidak bisa diambil dari server. Coba muat ulang."
    />
  );
}
