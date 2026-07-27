import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4">
      <div className="lever-card max-w-[420px] p-6 text-center">
        <p className="font-mono text-[0.8125rem] text-[var(--text-muted)]">404</p>
        <h1 className="mt-2 text-[1.125rem] font-semibold">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
          Alamat yang kamu buka tidak ada di LEVER.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-9 items-center rounded-[var(--radius)] bg-[var(--accent)] px-4 text-[0.875rem] font-medium text-white transition-colors duration-150 hover:bg-[var(--accent-hover)]"
        >
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  );
}
