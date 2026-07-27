"use client";

import { PageErrorBoundary, type PageErrorProps } from "@/components/ui/PageErrorBoundary";

/** Catches anything a page-level boundary did not, while keeping the shell. */
export default function Error({ error, reset }: PageErrorProps) {
  return <PageErrorBoundary error={error} reset={reset} />;
}
