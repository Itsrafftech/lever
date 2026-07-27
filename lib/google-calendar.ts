import { google, type calendar_v3 } from "googleapis";

import { decryptToken, encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

/* ---- Types --------------------------------------------------------------- */

export interface Calendar {
  id: string;
  summary: string;
  description: string | null;
  primary: boolean;
  accessRole: string;
  timeZone: string | null;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string | null;
  start: string; // ISO
  end: string; // ISO
  allDay: boolean;
  htmlLink: string | null;
  /** True when LEVER created this event (title carries the marker). */
  isLever: boolean;
}

export interface CalendarEventInput {
  summary: string;
  description?: string | null;
  start: Date;
  end: Date;
  calendarId?: string;
}

export type CalendarErrorCode =
  | "NOT_CONNECTED"
  | "RECONNECT_REQUIRED"
  | "NO_CALENDAR_SELECTED"
  | "API_ERROR";

export class CalendarError extends Error {
  readonly code: CalendarErrorCode;
  readonly status: number;

  constructor(code: CalendarErrorCode, message: string, status = 400) {
    super(message);
    this.name = "CalendarError";
    this.code = code;
    this.status = status;
  }
}

export const LEVER_PREFIX = "[LEVER]";

/* ---- Internals ----------------------------------------------------------- */

/** Refresh a minute early so a call never races the expiry. */
const EXPIRY_SKEW_MS = 60_000;

function oauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new CalendarError(
      "NOT_CONNECTED",
      "Integrasi Google belum dikonfigurasi di server. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.",
      503,
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret);
}

/** Google surfaces a revoked/expired grant as `invalid_grant`. */
function isInvalidGrant(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    message?: string;
    response?: { data?: { error?: string } };
  };
  return (
    candidate.response?.data?.error === "invalid_grant" ||
    Boolean(candidate.message?.includes("invalid_grant"))
  );
}

async function markReconnectRequired(userId: string): Promise<never> {
  await prisma.user
    .update({
      where: { id: userId },
      data: { googleTokenInvalidAt: new Date() },
    })
    .catch(() => undefined);

  throw new CalendarError(
    "RECONNECT_REQUIRED",
    "Kalender perlu dihubungkan ulang. Google menolak izin yang tersimpan.",
    401,
  );
}

/* ---- Public API ---------------------------------------------------------- */

/**
 * Returns a usable access token, refreshing it first when it is expired or
 * about to be. Throws a typed CalendarError rather than a raw Google error.
 */
export async function refreshTokenIfNeeded(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user) {
    throw new CalendarError("NOT_CONNECTED", "Akun tidak ditemukan.", 404);
  }

  const accessToken = decryptToken(user.googleAccessToken);
  const refreshToken = decryptToken(user.googleRefreshToken);

  if (!refreshToken && !accessToken) {
    throw new CalendarError(
      "NOT_CONNECTED",
      "Google Calendar belum dihubungkan. Hubungkan lewat Pengaturan.",
      409,
    );
  }

  const expiresAt = user.googleTokenExpiry?.getTime() ?? 0;
  const stillValid = accessToken && expiresAt - EXPIRY_SKEW_MS > Date.now();
  if (stillValid) return accessToken;

  if (!refreshToken) {
    // Access token expired and Google never gave us a refresh token, so the
    // only way forward is a fresh consent.
    return markReconnectRequired(userId);
  }

  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await client.refreshAccessToken();
    if (!credentials.access_token) {
      return markReconnectRequired(userId);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: encryptToken(credentials.access_token),
        ...(credentials.refresh_token
          ? { googleRefreshToken: encryptToken(credentials.refresh_token) }
          : {}),
        googleTokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
        googleTokenInvalidAt: null,
      },
    });

    return credentials.access_token;
  } catch (error) {
    if (isInvalidGrant(error)) return markReconnectRequired(userId);
    throw new CalendarError(
      "API_ERROR",
      "Google menolak permintaan penyegaran token. Coba lagi beberapa saat lagi.",
      502,
    );
  }
}

async function calendarClient(userId: string): Promise<calendar_v3.Calendar> {
  const accessToken = await refreshTokenIfNeeded(userId);
  const client = oauthClient();
  client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: client });
}

/** Wraps a Google call so invalid_grant becomes a typed reconnect error. */
async function callGoogle<T>(userId: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isInvalidGrant(error)) return markReconnectRequired(userId);
    if (error instanceof CalendarError) throw error;

    const status = (error as { code?: number; status?: number }).code ?? 502;
    if (status === 401 || status === 403) return markReconnectRequired(userId);

    throw new CalendarError(
      "API_ERROR",
      "Google Calendar tidak merespons seperti yang diharapkan. Coba sinkronkan ulang nanti.",
      502,
    );
  }
}

export async function getCalendars(userId: string): Promise<Calendar[]> {
  const calendar = await calendarClient(userId);

  return callGoogle(userId, async () => {
    const { data } = await calendar.calendarList.list({ maxResults: 100 });
    return (data.items ?? [])
      // Only calendars we can actually write events to are useful targets.
      .filter((item) => item.accessRole === "owner" || item.accessRole === "writer")
      .map((item) => ({
        id: item.id ?? "",
        summary: item.summary ?? "(tanpa nama)",
        description: item.description ?? null,
        primary: Boolean(item.primary),
        accessRole: item.accessRole ?? "reader",
        timeZone: item.timeZone ?? null,
      }))
      .filter((item) => item.id.length > 0);
  });
}

async function resolveCalendarId(
  userId: string,
  override?: string,
): Promise<string> {
  if (override) return override;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleCalendarId: true },
  });

  if (!user?.googleCalendarId) {
    throw new CalendarError(
      "NO_CALENDAR_SELECTED",
      "Belum ada kalender tujuan. Pilih kalender di Pengaturan > Kalender.",
      409,
    );
  }
  return user.googleCalendarId;
}

/** Creates an event and returns its Google event id. */
export async function createEvent(
  userId: string,
  event: CalendarEventInput,
): Promise<string> {
  const calendar = await calendarClient(userId);
  const calendarId = await resolveCalendarId(userId, event.calendarId);

  return callGoogle(userId, async () => {
    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description ?? undefined,
        start: { dateTime: event.start.toISOString() },
        end: { dateTime: event.end.toISOString() },
      },
    });

    if (!data.id) {
      throw new CalendarError(
        "API_ERROR",
        "Google membuat acara tetapi tidak mengembalikan ID-nya.",
        502,
      );
    }
    return data.id;
  });
}

export async function updateEvent(
  userId: string,
  eventId: string,
  updates: Partial<CalendarEventInput>,
): Promise<void> {
  const calendar = await calendarClient(userId);
  const calendarId = await resolveCalendarId(userId, updates.calendarId);

  await callGoogle(userId, async () => {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        ...(updates.summary ? { summary: updates.summary } : {}),
        ...(updates.description === undefined
          ? {}
          : { description: updates.description ?? undefined }),
        ...(updates.start ? { start: { dateTime: updates.start.toISOString() } } : {}),
        ...(updates.end ? { end: { dateTime: updates.end.toISOString() } } : {}),
      },
    });
  });
}

export async function deleteEvent(
  userId: string,
  eventId: string,
  calendarIdOverride?: string,
): Promise<void> {
  const calendar = await calendarClient(userId);
  const calendarId = await resolveCalendarId(userId, calendarIdOverride);

  await callGoogle(userId, async () => {
    try {
      await calendar.events.delete({ calendarId, eventId });
    } catch (error) {
      // Already gone is the desired end state, not a failure.
      const status = (error as { code?: number }).code;
      if (status === 404 || status === 410) return;
      throw error;
    }
  });
}

export async function getUpcomingEvents(
  userId: string,
  days: number,
): Promise<CalendarEvent[]> {
  const calendar = await calendarClient(userId);
  const calendarId = await resolveCalendarId(userId);

  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + days * 86_400_000);

  return callGoogle(userId, async () => {
    const { data } = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return (data.items ?? [])
      .filter((item) => item.status !== "cancelled")
      .map((item) => {
        const allDay = Boolean(item.start?.date);
        const start = item.start?.dateTime ?? item.start?.date;
        const end = item.end?.dateTime ?? item.end?.date;
        if (!start || !end) return null;

        const summary = item.summary ?? "(tanpa judul)";
        return {
          id: item.id ?? "",
          summary,
          description: item.description ?? null,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          allDay,
          htmlLink: item.htmlLink ?? null,
          isLever: summary.startsWith(LEVER_PREFIX),
        } satisfies CalendarEvent;
      })
      .filter((item): item is CalendarEvent => item !== null && item.id.length > 0);
  });
}

/* ---- Safe wrappers ------------------------------------------------------- */

export interface SafeResult<T> {
  data: T | null;
  error: { code: CalendarErrorCode; message: string } | null;
}

/**
 * Runs a calendar operation without ever throwing. Non-calendar routes (task
 * and session mutations) use this so a Google outage can never turn a
 * successful local write into a 500.
 */
export async function safeCalendar<T>(
  run: () => Promise<T>,
): Promise<SafeResult<T>> {
  try {
    return { data: await run(), error: null };
  } catch (error) {
    if (error instanceof CalendarError) {
      return { data: null, error: { code: error.code, message: error.message } };
    }
    return {
      data: null,
      error: {
        code: "API_ERROR",
        message: "Sinkronisasi kalender gagal karena kesalahan tak terduga.",
      },
    };
  }
}

/** Connection state used by the settings page and the reconnect banner. */
export async function getCalendarStatus(userId: string): Promise<{
  connected: boolean;
  needsReconnect: boolean;
  calendarId: string | null;
  lastSyncedAt: string | null;
  syncSessions: boolean;
  importEvents: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleRefreshToken: true,
      googleAccessToken: true,
      googleTokenInvalidAt: true,
      googleCalendarId: true,
      calendarLastSyncedAt: true,
      syncSessionsToCalendar: true,
      importCalendarEvents: true,
    },
  });

  return {
    connected: Boolean(user?.googleRefreshToken ?? user?.googleAccessToken),
    needsReconnect: Boolean(user?.googleTokenInvalidAt),
    calendarId: user?.googleCalendarId ?? null,
    lastSyncedAt: user?.calendarLastSyncedAt?.toISOString() ?? null,
    syncSessions: user?.syncSessionsToCalendar ?? true,
    importEvents: user?.importCalendarEvents ?? true,
  };
}
