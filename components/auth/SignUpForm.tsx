"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrength";
import { signUpSchema } from "@/lib/validations/auth";
import type { ApiEnvelope } from "@/lib/api";

export function SignUpForm() {
  const router = useRouter();

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = signUpSchema.safeParse(values);
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

    let payload: ApiEnvelope<unknown>;
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      payload = (await response.json()) as ApiEnvelope<unknown>;
    } catch {
      setLoading(false);
      setFormError(
        "Tidak bisa menghubungi server. Periksa koneksi internet lalu coba lagi.",
      );
      return;
    }

    if (payload.error) {
      setLoading(false);
      setFormError(payload.error.message);
      if (payload.error.fields) setFieldErrors(payload.error.fields);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);

    if (!result || result.error) {
      setFormError(
        "Akun berhasil dibuat, tapi sesi gagal dimulai. Silakan masuk secara manual.",
      );
      router.push("/auth/signin");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="lever-card p-5">
      <h1 className="text-[1.5rem] font-semibold">Buat akun</h1>
      <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
        Gratis, dan langsung bisa dipakai hari ini.
      </p>

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

      <div className="mt-5">
        <GoogleButton callbackUrl="/onboarding" label="Daftar dengan Google" />
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[0.75rem] uppercase tracking-wider text-[var(--text-muted)]">
          atau
        </span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Input
          label="Nama"
          autoComplete="name"
          placeholder="Nama lengkap"
          value={values.name}
          error={fieldErrors.name}
          onChange={(event) => update("name", event.target.value)}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@domain.com"
          value={values.email}
          error={fieldErrors.email}
          onChange={(event) => update("email", event.target.value)}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={values.password}
            error={fieldErrors.password}
            onChange={(event) => update("password", event.target.value)}
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
          <PasswordStrengthMeter password={values.password} />
        </div>

        <Input
          label="Konfirmasi password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Ulangi password"
          value={values.confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={(event) => update("confirmPassword", event.target.value)}
        />

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Buat akun
        </Button>
      </form>

      <p className="mt-5 border-t border-[var(--border)] pt-4 text-[0.8125rem] text-[var(--text-secondary)]">
        Sudah punya akun?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}
