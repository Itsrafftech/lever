"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrength";
import { describeError, mutateJson } from "@/lib/fetcher";
import { toast } from "@/lib/store/toast";
import { TIMEZONES } from "@/lib/timezones";

export interface AccountSectionProps {
  email: string;
  timezone: string;
  /** Google-only accounts have no password to change. */
  hasPassword: boolean;
}

export function AccountSection({
  email,
  timezone: initialTimezone,
  hasPassword,
}: AccountSectionProps) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [savingTimezone, setSavingTimezone] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveTimezone(value: string) {
    const previous = timezone;
    setTimezone(value);
    setSavingTimezone(true);
    try {
      await mutateJson("/api/settings", "PATCH", { timezone: value });
      toast.success(
        "Zona waktu diperbarui",
        "Statistik harian dihitung ulang memakai zona ini.",
      );
    } catch (cause) {
      setTimezone(previous);
      toast.error("Zona waktu gagal disimpan", describeError(cause));
    } finally {
      setSavingTimezone(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordErrors({});
    setChangingPassword(true);

    try {
      await mutateJson("/api/account/password", "POST", {
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      toast.success("Password diperbarui");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (cause) {
      const fields =
        cause && typeof cause === "object" && "fields" in cause
          ? ((cause as { fields?: Record<string, string> }).fields ?? {})
          : {};
      setPasswordErrors(fields);
      toast.error("Password gagal diubah", describeError(cause));
    } finally {
      setChangingPassword(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await mutateJson("/api/account", "DELETE", { confirm: deleteConfirm });
      toast.success("Akun dihapus", "Semua data kamu sudah dihapus permanen.");
      void signOut({ callbackUrl: "/auth/signin" });
    } catch (cause) {
      setDeleting(false);
      toast.error("Akun gagal dihapus", describeError(cause));
    }
  }

  return (
    <>
      <section className="lever-card p-5">
        <h2 className="text-[1.125rem] font-semibold">Akun</h2>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">{email}</p>

        <div className="mt-4">
          <Select
            label="Zona waktu"
            value={timezone}
            disabled={savingTimezone}
            onChange={saveTimezone}
            hint="Menentukan kapan harimu dimulai untuk streak dan statistik harian."
            options={TIMEZONES.map((zone) => ({
              value: zone.value,
              label: zone.label,
              description: zone.description,
            }))}
          />
        </div>

        {hasPassword ? (
          <form
            className="mt-5 space-y-4 border-t border-[var(--border)] pt-4"
            onSubmit={changePassword}
            noValidate
          >
            <h3 className="text-[0.9375rem] font-medium">Ubah password</h3>

            <Input
              label="Password saat ini"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={current}
              error={passwordErrors.currentPassword}
              onChange={(event) => setCurrent(event.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShow((value) => !value)}
                  aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                  className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              }
            />

            <div>
              <Input
                label="Password baru"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={next}
                error={passwordErrors.newPassword}
                onChange={(event) => setNext(event.target.value)}
              />
              <PasswordStrengthMeter password={next} />
            </div>

            <Input
              label="Konfirmasi password baru"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              error={passwordErrors.confirmPassword}
              onChange={(event) => setConfirm(event.target.value)}
            />

            <Button
              type="submit"
              loading={changingPassword}
              disabled={!current || !next || !confirm}
            >
              Simpan password baru
            </Button>
          </form>
        ) : (
          <p className="mt-5 border-t border-[var(--border)] pt-4 text-[0.8125rem] text-[var(--text-muted)]">
            Akun ini masuk lewat Google, jadi tidak ada password untuk diubah.
          </p>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[color:var(--danger)]/25 bg-[var(--danger-bg)] p-5">
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]"
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="text-[1.125rem] font-semibold">Zona berbahaya</h2>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--text-secondary)]">
              Menghapus akun akan menghapus semua tujuan, tugas, sesi fokus,
              niat, dan riwayat refleksi secara permanen. Tindakan ini tidak
              bisa dibatalkan.
            </p>
          </div>
        </div>

        <Button
          className="mt-4"
          variant="danger"
          onClick={() => {
            setDeleteConfirm("");
            setDeleteOpen(true);
          }}
        >
          Hapus akun
        </Button>
      </section>

      {deleteOpen ? (
        <Modal
          open
          size="sm"
          title="Hapus akun permanen?"
          description="Semua data akan hilang dan tidak bisa dipulihkan."
          onClose={() => setDeleteOpen(false)}
          footer={
            <>
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                loading={deleting}
                disabled={deleteConfirm !== "hapus"}
                onClick={deleteAccount}
              >
                Hapus akun saya
              </Button>
            </>
          }
        >
          <Input
            label='Ketik "hapus" untuk mengonfirmasi'
            value={deleteConfirm}
            autoComplete="off"
            placeholder="hapus"
            onChange={(event) => setDeleteConfirm(event.target.value)}
          />
        </Modal>
      ) : null}
    </>
  );
}
