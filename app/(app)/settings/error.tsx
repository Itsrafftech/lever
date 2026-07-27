"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

export default function Error({ error, reset }: PageErrorProps) {
  return (
    <PageErrorBoundary
      error={error}
      reset={reset}
      title="Pengaturan gagal dimuat"
      message="Pengaturan akun tidak bisa diambil. Coba muat ulang."
    />
  );
}
