import { Resend } from "resend";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "LEVER";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

/**
 * Transactional mail is best-effort: a failure here must never block signup.
 * The caller gets a result object instead of an exception.
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
): Promise<SendResult> {
  const resend = client();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    return { sent: false, reason: "RESEND_API_KEY atau RESEND_FROM_EMAIL belum diatur" };
  }

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${from}>`,
      to,
      subject: `Selamat datang di ${APP_NAME}`,
      html: welcomeHtml(name),
      text: welcomeText(name),
    });

    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Kesalahan tidak dikenal",
    };
  }
}

function welcomeText(name: string): string {
  return [
    `Halo ${name},`,
    "",
    `Akun ${APP_NAME} kamu sudah aktif.`,
    "",
    "Prokrastinasi bukan masalah manajemen waktu — ini masalah regulasi emosi. LEVER bekerja dengan empat tuas dari Temporal Motivation Theory (Steel, 2007): Expectancy, Value, Impulsiveness, dan Delay.",
    "",
    "Langkah pertama: tentukan satu North Star goal, lalu pecah menjadi tugas 15 menit.",
    "",
    `Mulai di sini: ${APP_URL}/onboarding`,
  ].join("\n");
}

function welcomeHtml(name: string): string {
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:32px 16px;background:#F7F6F3;font-family:'Poppins',Helvetica,Arial,sans-serif;color:#18170F;">
    <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E3DFD7;border-radius:12px;padding:28px;">
      <p style="margin:0 0 20px;font-size:14px;font-weight:600;letter-spacing:.08em;color:#D4660A;">${APP_NAME}</p>
      <h1 style="margin:0 0 14px;font-size:22px;font-weight:600;">Halo ${escapeHtml(name)},</h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#5C5847;">
        Akun kamu sudah aktif. Prokrastinasi bukan masalah manajemen waktu — ini masalah regulasi emosi.
      </p>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#5C5847;">
        LEVER bekerja dengan empat tuas dari Temporal Motivation Theory (Steel, 2007):
        Expectancy, Value, Impulsiveness, dan Delay. Mulai dengan menentukan satu North Star goal.
      </p>
      <a href="${APP_URL}/onboarding"
         style="display:inline-block;background:#D4660A;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:500;padding:10px 18px;border-radius:8px;">
        Mulai onboarding
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#9C9580;">
        Kamu menerima email ini karena mendaftar di ${APP_NAME}.
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
