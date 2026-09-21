import type { Weekday } from './primitives';

/**
 * The calendar date the athlete is actually living in.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that reports the UTC date, so
 * an evening session east of Greenwich — or an early-morning one west of it —
 * would be filed under the wrong day.
 */
export const localIsoDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * The same calendar date moved by whole days.
 *
 * Built at midday so a daylight-saving jump cannot land the result on the
 * previous or next date.
 */
export const shiftDays = (iso: string, days: number): string => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
};

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** Which day of the week an ISO calendar date falls on. */
export const weekdayOf = (iso: string): Weekday => {
  const date = new Date(`${iso}T12:00:00`);
  return WEEKDAYS[date.getDay()]!;
};
