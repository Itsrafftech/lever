"use client";

/**
 * Last resort: a failure in the root layout itself, where the normal shell and
 * fonts are unavailable. Styling is inline because globals.css may not apply.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F6F3",
          color: "#18170F",
          fontFamily: "Poppins, Helvetica, Arial, sans-serif",
          padding: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            background: "#FFFFFF",
            border: "1px solid #E3DFD7",
            borderRadius: 12,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600 }}>
            Aplikasi gagal dimuat
          </h1>
          <p
            style={{
              margin: "8px 0 20px",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "#5C5847",
            }}
          >
            Terjadi kesalahan mendasar saat memuat LEVER. Muat ulang halaman
            untuk mencoba lagi.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 36,
              padding: "0 16px",
              background: "#D4660A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Muat ulang
          </button>
          {error.digest ? (
            <p
              style={{
                margin: "16px 0 0",
                fontSize: "0.75rem",
                color: "#9C9580",
                fontFamily: "monospace",
              }}
            >
              Kode: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
