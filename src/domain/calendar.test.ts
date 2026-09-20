import { describe, expect, it } from 'vitest';
import { localIsoDate, weekdayOf } from './calendar';

describe('localIsoDate', () => {
  it('uses the calendar date the athlete is living in, not the UTC one', () => {
    // 00:30 on the 20th locally. In any zone ahead of UTC this instant is still
    // the 19th in UTC, which is what a toISOString().slice(0, 10) would report.
    expect(localIsoDate(new Date(2026, 8, 20, 0, 30))).toBe('2026-09-20');
  });

  it('pads single-digit months and days', () => {
    expect(localIsoDate(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('handles the last moment of a day', () => {
    expect(localIsoDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('weekdayOf', () => {
  it('names the weekday for a date', () => {
    expect(weekdayOf('2026-09-21')).toBe('monday');
    expect(weekdayOf('2026-09-22')).toBe('tuesday');
    expect(weekdayOf('2026-09-24')).toBe('thursday');
    expect(weekdayOf('2026-09-26')).toBe('saturday');
  });

  it('handles the week rolling over to Sunday', () => {
    expect(weekdayOf('2026-09-20')).toBe('sunday');
    expect(weekdayOf('2026-09-27')).toBe('sunday');
  });

  it('is not thrown off by the timezone', () => {
    // Parsed at midday so a UTC offset either way cannot shift the day.
    expect(weekdayOf('2026-01-01')).toBe('thursday');
  });
});
