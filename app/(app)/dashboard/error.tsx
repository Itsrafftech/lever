"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

export default function Error({ error, reset }: PageErrorProps) {
  return (
    <PageErrorBoundary
      error={error}
      reset={reset}
      title="Dashboard gagal dimuat"
      message="Data ringkasan hari ini tidak bisa diambil. Coba muat ulang."
    />
  );
}
