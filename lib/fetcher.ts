import type { ApiEnvelope } from "@/lib/api";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    message: string,
    code: string,
    status: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

async function readEnvelope<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiRequestError(
      `Server membalas dengan format tak terduga (HTTP ${response.status}).`,
      "BAD_RESPONSE",
      response.status,
    );
  }

  if (payload.error) {
    throw new ApiRequestError(
      payload.error.message,
      payload.error.code,
      response.status,
      payload.error.fields,
    );
  }

  return payload.data as T;
}

/** SWR fetcher. Unwraps the `{ data, error }` envelope. */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  return readEnvelope<T>(response);
}

type Method = "POST" | "PATCH" | "PUT" | "DELETE";

/** Mutating request helper. Throws ApiRequestError so callers can show `.message`. */
export async function mutateJson<T>(
  url: string,
  method: Method,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return readEnvelope<T>(response);
}

/** Network failures surface as TypeError; give them a usable message. */
export function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof TypeError) {
    return "Tidak bisa menghubungi server. Periksa koneksi internet lalu coba lagi.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Terjadi kesalahan yang tidak dikenal.";
}
