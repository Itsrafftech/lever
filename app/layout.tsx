import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";

import { Toaster } from "@/components/ui/Toast";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "LEVER";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${appName} — Sistem Anti-Prokrastinasi`,
    template: `%s · ${appName}`,
  },
  description:
    "Kelola tugas dengan intervensi berbasis riset: Temporal Motivation Theory, implementation intentions, dan sesi fokus terukur.",
  applicationName: appName,
  openGraph: {
    title: `${appName} — Sistem Anti-Prokrastinasi`,
    description:
      "Prokrastinasi adalah masalah regulasi emosi, bukan manajemen waktu. LEVER membantu kamu memulai.",
    type: "website",
    locale: "id_ID",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F7F6F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
