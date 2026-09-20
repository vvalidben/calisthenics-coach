import { describe, expect, it } from 'vitest';
import { localIsoDate } from './today';

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
