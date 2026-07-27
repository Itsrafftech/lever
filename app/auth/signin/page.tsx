import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import { SkeletonLines } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke ruang kerja LEVER dengan Google atau email dan password.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="lever-card p-5">
          <SkeletonLines count={5} />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
