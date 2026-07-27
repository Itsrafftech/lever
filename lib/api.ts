import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code: string;
  fields?: Record<string, string>;
}

export function ok<T>(data: T, status = 200): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

export function fail(
  message: string,
  code: string,
  status: number,
  fields?: Record<string, string>,
): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json(
    { data: null, error: { message, code, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export const unauthorized = () =>
  fail("Sesi kamu sudah berakhir. Masuk kembali untuk melanjutkan.", "UNAUTHORIZED", 401);

export const notFound = (what: string) =>
  fail(`${what} tidak ditemukan atau bukan milik akun ini.`, "NOT_FOUND", 404);

/**
 * Turns a ZodError into a field-keyed map so forms can highlight the
 * exact input that failed instead of showing one generic message.
 */
export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function validationFailure(error: ZodError) {
  const fields = zodFields(error);
  const first = Object.entries(fields)[0];
  return fail(
    first ? `${first[1]}` : "Data yang dikirim tidak valid.",
    "VALIDATION_ERROR",
    422,
    fields,
  );
}

/** Parses a JSON request body against a schema, returning a tagged result. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<
  { success: true; data: T } | { success: false; response: NextResponse<ApiEnvelope<never>> }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      success: false,
      response: fail(
        "Body permintaan bukan JSON yang valid.",
        "INVALID_JSON",
        400,
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, response: validationFailure(parsed.error) };
  }
  return { success: true, data: parsed.data };
}

/** Parses URL search params against a schema. */
export function parseQuery<T>(
  request: Request,
  schema: ZodType<T>,
):
  | { success: true; data: T }
  | { success: false; response: NextResponse<ApiEnvelope<never>> } {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, response: validationFailure(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
