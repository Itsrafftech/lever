"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

export default function Error({ error, reset }: PageErrorProps) {
  return (
    <PageErrorBoundary
      error={error}
      reset={reset}
      title="Halaman masuk gagal dimuat"
      message="Formulir autentikasi tidak bisa disiapkan. Coba muat ulang."
    />
  );
}
