"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function GoogleButton({
  callbackUrl,
  label = "Masuk dengan Google",
}: {
  callbackUrl: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="ghost"
      size="lg"
      fullWidth
      loading={loading}
      icon={<Globe className="h-[18px] w-[18px]" aria-hidden />}
      onClick={() => {
        setLoading(true);
        void signIn("google", { callbackUrl });
      }}
    >
      {label}
    </Button>
  );
}
