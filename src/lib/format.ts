const TZ = process.env.NEWSROOM_TIMEZONE || "Asia/Dhaka";

const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
}

export function newsroomTimezone() {
  return TZ;
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("bn-BD", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  const d = new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(date);
  return `${d}, ${formatTime(date)}`;
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** Relative time in Bangla for recent items, falling back to an absolute date. */
export function timeAgo(date: Date, now = new Date()): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "এইমাত্র";
  if (min < 60) return `${toBnDigits(min)} মিনিট আগে`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${toBnDigits(hr)} ঘণ্টা আগে`;
  return formatDateShort(date);
}

/** Date part (YYYY-MM-DD) of an instant in the newsroom timezone. */
export function zonedDateKey(date: Date, tz = TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return parts; // en-CA formats as YYYY-MM-DD
}

function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - date.getTime();
}

/** Interpret "YYYY-MM-DDTHH:mm" as wall-clock time in the newsroom timezone and return the UTC instant. */
export function zonedLocalToUtc(local: string, tz = TZ): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offset = tzOffsetMs(new Date(guess), tz);
  return new Date(guess - offset);
}

/** Format a UTC instant as "YYYY-MM-DDTHH:mm" wall-clock in the newsroom timezone, for datetime-local inputs. */
export function utcToZonedLocal(date: Date | null | undefined, tz = TZ): string {
  if (!date) return "";
  const shifted = new Date(date.getTime() + tzOffsetMs(date, tz));
  return shifted.toISOString().slice(0, 16);
}

/** Start and end (UTC) of a calendar day in the newsroom timezone. */
export function zonedDayRange(day: string, tz = TZ): { start: Date; end: Date } | null {
  const start = zonedLocalToUtc(`${day}T00:00`, tz);
  if (!start) return null;
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = zonedLocalToUtc(`${next.toISOString().slice(0, 10)}T00:00`, tz)!;
  return { start, end };
}
