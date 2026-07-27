"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

export default function Error({ error, reset }: PageErrorProps) {
  return (
    <PageErrorBoundary
      error={error}
      reset={reset}
      title="Niat jika-maka gagal dimuat"
      message="Daftar niat tidak bisa diambil. Coba muat ulang."
    />
  );
}
