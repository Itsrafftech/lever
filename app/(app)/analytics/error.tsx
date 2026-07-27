"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

export default function Error({ error, reset }: PageErrorProps) {
  return (
    <PageErrorBoundary
      error={error}
      reset={reset}
      title="Analitik gagal dimuat"
      message="Agregasi 30 hari tidak bisa dihitung sekarang. Coba muat ulang."
    />
  );
}
