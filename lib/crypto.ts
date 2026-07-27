import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY belum diatur. Jalankan `openssl rand -hex 32` dan simpan hasilnya di .env.local.",
    );
  }

  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY harus 32 byte dalam format hex (64 karakter). Nilai saat ini menghasilkan ${key.length} byte.`,
    );
  }
  return key;
}

/** Encrypts a token for storage. Output format: `<iv-hex>:<ciphertext-hex>`. */
export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Reverses `encryptToken`. Returns null when the payload is malformed. */
export function decryptToken(payload: string | null | undefined): string | null {
  if (!payload) return null;

  const separator = payload.indexOf(":");
  if (separator === -1) return null;

  const ivHex = payload.slice(0, separator);
  const dataHex = payload.slice(separator + 1);
  if (ivHex.length !== IV_LENGTH * 2 || dataHex.length === 0) return null;

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(ivHex, "hex"),
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
