import { localIsoDate, shiftDays, weekdayOf } from './calendar';
import type { UserProfile } from './profile';
import type { WorkoutSession } from './session';
import type { Workout } from './workout';

/**
 * When to remind, and what to say.
 *
 * Everything here is a pure function of the profile, the program and a clock
 * reading. Nothing schedules a timer, asks for a permission or shows anything —
 * a reminder is a *fact about a day*, and delivering it is somebody else's job
 * (`notifications/`, driven by `features/reminders/`). That split is what lets
 * the scheduling be tested at any date and time without a browser.
 *
 * There is one clock in the system: `profile.preferredTrainingTime`. A lead
 * time shifts the reminder off it, so moving training an hour later moves the
 * reminder with it and nothing can drift out of step.
 */

export const REMINDER_KINDS = ['training', 'mobility'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export interface Reminder {
  /**
   * Stable for the day and the kind, so a delivered reminder can be recorded
   * and never shown twice.
   */
  id: string;
  date: string;
  kind: ReminderKind;
  /** Local 24-hour time the reminder becomes due. */
  at: string;
  workoutId: string | null;
  title: string;
  body: string;
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

const toTime = (minutes: number): string => {
  const clamped = Math.max(0, minutes);
  return `${`${Math.floor(clamped / 60)}`.padStart(2, '0')}:${`${clamped % 60}`.padStart(2, '0')}`;
};

const minutesInto = (now: Date): number => now.getHours() * 60 + now.getMinutes();

/**
 * When the reminder for any training day is due.
 *
 * Clamped at midnight rather than rolled into the previous evening: a reminder
 * that arrives the day before is not a reminder, it is a surprise.
 */
export const reminderTime = (profile: UserProfile): string =>
  toTime(toMinutes(profile.preferredTrainingTime) - profile.reminders.minutesBefore);

const workedOut = (sessions: WorkoutSession[], date: string, kind: ReminderKind): boolean =>
  sessions.some(
    (session) =>
      session.date === date &&
      session.kind === kind &&
      (session.status === 'completed' || session.status === 'partial'),
  );

/**
 * The reminder for one date, or null if that day has nothing to say.
 *
 * A training day with no workout written for it stays silent: better nothing
 * than a reminder that cannot tell the athlete what they are being reminded of.
 */
export const reminderFor = (
  date: string,
  profile: UserProfile,
  workouts: Workout[],
): Reminder | null => {
  if (!profile.reminders.enabled) return null;

  const at = reminderTime(profile);
  const weekday = weekdayOf(date);

  if (profile.trainingDays.includes(weekday)) {
    const workout = workouts.find((w) => w.kind === 'training' && w.day === weekday);
    if (!workout) return null;

    return {
      id: `training:${date}`,
      date,
      kind: 'training',
      at,
      workoutId: workout.id,
      title: "Today's workout is ready",
      // The workout's own published length. Computing it here would mean the
      // domain reaching for the exercise catalogue, which it may not do — and
      // `program.test.ts` already holds the two within a minute or two.
      body: `${workout.estimatedMinutes} minutes of ${workout.name}. Start when you're ready.`,
    };
  }

  if (profile.reminders.mobilityOnRestDays) {
    return {
      id: `mobility:${date}`,
      date,
      kind: 'mobility',
      at,
      workoutId: null,
      title: 'Rest day',
      body: 'A few minutes of mobility is there if you want it. Skipping it costs you nothing.',
    };
  }

  return null;
};

interface ScheduleArgs {
  profile: UserProfile;
  workouts: Workout[];
  now: Date;
}

/** How far ahead to look before giving up. Two weeks covers any weekly schedule. */
const HORIZON_DAYS = 14;

/**
 * The next reminder that has not yet come due, looking forward from `now`.
 *
 * Used to tell the athlete when they will next hear from the app, which is the
 * only honest way to show that a settings change took effect.
 */
export const nextReminder = ({ profile, workouts, now }: ScheduleArgs): Reminder | null => {
  const today = localIsoDate(now);

  for (let offset = 0; offset <= HORIZON_DAYS; offset += 1) {
    const reminder = reminderFor(shiftDays(today, offset), profile, workouts);
    if (reminder === null) continue;
    if (offset === 0 && minutesInto(now) > toMinutes(reminder.at)) continue;
    return reminder;
  }

  return null;
};

/**
 * The reminder that should be showing right now, if any.
 *
 * Stays due for the rest of the day once its time passes — a late start beats
 * no start — and goes quiet the moment any work is logged. It only ever looks
 * at today: a day that went by untrained is missed, and bringing it up the
 * next morning would be rescheduling it by another name.
 */
export const dueReminder = ({
  profile,
  workouts,
  sessions,
  now,
}: ScheduleArgs & { sessions: WorkoutSession[] }): Reminder | null => {
  const today = localIsoDate(now);
  const reminder = reminderFor(today, profile, workouts);

  if (reminder === null) return null;
  if (minutesInto(now) < toMinutes(reminder.at)) return null;
  if (workedOut(sessions, today, reminder.kind)) return null;

  return reminder;
};
