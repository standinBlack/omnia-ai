import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";
import { addDays, startOfDay } from "date-fns";

export function getLocalDate(timezone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}

export function getNextResetTime(timezone: string, now: Date = new Date()): Date {
  const zoned = utcToZonedTime(now, timezone);
  const nextMidnight = startOfDay(addDays(zoned, 1));
  return zonedTimeToUtc(nextMidnight, timezone);
}

export function isPastLocalMidnight(timezone: string, previousLocalDate: string, now: Date = new Date()): boolean {
  return getLocalDate(timezone, now) !== previousLocalDate;
}
