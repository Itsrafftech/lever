"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { signInSchema } from "@/lib/validations/auth";

type Method = "google" | "credentials";

const PROVIDER_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "Email ini sudah terdaftar dengan password. Masuk lewat tab Email & Password terlebih dahulu.",
  AccessDenied:
    "Akses ke akun Google ditolak. Izinkan akses email dan kalender untuk melanjutkan.",
  Configuration:
    "Konfigurasi Google OAuth belum lengkap. Pastikan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET sudah diatur.",
  OAuthCallback:
    "Google menolak proses callback. Periksa apakah redirect URI di Google Cloud Console sama dengan NEXTAUTH_URL.",
};

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const providerError = searchParams.get("error");

  const [method, setMethod] = useState<Method>("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(
    providerError
      ? (PROVIDER_ERRORS[providerError] ??
        "Proses masuk gagal. Coba ulangi atau gunakan metode lain.")
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (!result || result.error) {
      setFormError(
        "Email atau password salah. Periksa kembali, atau daftar dulu jika belum punya akun.",
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="lever-card p-5">
      <h1 className="text-[1.5rem] font-semibold">Masuk</h1>
      <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
        Lanjutkan ke ruang kerja kamu.
      </p>

      <Tabs
        className="mt-5"
        ariaLabel="Metode masuk"
        value={method}
        onChange={(next) => {
          setMethod(next);
          setFormError(null);
        }}
        items={[
          { value: "google", label: "Google" },
          { value: "credentials", label: "Email & Password" },
        ]}
      />

      {formError ? (
        <div className="mt-4 flex items-start gap-2 rounded-[var(--radius)] border border-[color:var(--danger)]/25 bg-[var(--danger-bg)] p-3">
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]"
            aria-hidden
          />
          <p className="text-[0.8125rem] text-[var(--text-primary)]">
            {formError}
          </p>
        </div>
      ) : null}

      {method === "google" ? (
        <div className="mt-5">
          <GoogleButton callbackUrl={callbackUrl} />
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--text-muted)]">
            LEVER meminta izin kalender agar sesi fokus bisa disinkronkan ke
            Google Calendar. Izin ini bisa dicabut kapan saja di Pengaturan.
          </p>
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@domain.com"
            value={email}
            error={fieldErrors.email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            }
          />

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Masuk
          </Button>
        </form>
      )}

      <p className="mt-5 border-t border-[var(--border)] pt-4 text-[0.8125rem] text-[var(--text-secondary)]">
        Belum punya akun?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </div>
  );
}
