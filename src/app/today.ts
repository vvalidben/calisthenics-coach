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
