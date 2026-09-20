import { localIsoDate, weekdayOf } from './calendar';
import type { Weekday } from './primitives';
import type { UserProfile } from './profile';
import type { WorkoutSession } from './session';
import { weekStart } from './stats';
import type { Workout } from './workout';

/**
 * The training calendar.
 *
 * A missed day is **derived, never stored**. If the app is not opened on a
 * Monday there is no record of that Monday at all, so the calendar works it out
 * from the schedule: a training day in the past with nothing completed on it was
 * missed. Nothing is written back, nothing is moved to another day, and a missed
 * session stays missed for good — which is the athlete's own rule.
 */

export const DAY_STATUSES = ['completed', 'partial', 'missed', 'planned', 'rest'] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export interface CalendarDay {
  date: string;
  weekday: Weekday;
  status: DayStatus;
  /** The session's workout name, or the one that was scheduled and skipped. */
  workoutName: string | null;
  /** Set only when there is a session to open. */
  sessionId: string | null;
  /** Restorative routines finished that day, counted separately. */
  mobilityCount: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface CalendarWeek {
  /** The Monday the week starts on. */
  start: string;
  days: CalendarDay[];
  completed: number;
  planned: number;
}

const shift = (iso: string, days: number): string => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
};

const isDone = (session: WorkoutSession) =>
  session.status === 'completed' || session.status === 'partial';

interface HistoryArgs {
  sessions: WorkoutSession[];
  profile: UserProfile;
  workouts: Workout[];
  today: string;
  /** How many weeks back to build, including the current one. */
  weeks?: number;
}

const dayFor = (
  date: string,
  { sessions, profile, workouts, today }: HistoryArgs,
): CalendarDay => {
  const weekday = weekdayOf(date);
  const onThisDate = sessions.filter((s) => s.date === date);

  const training = onThisDate.find((s) => s.kind === 'training' && isDone(s));
  const attempted = onThisDate.find((s) => s.kind === 'training');
  const mobilityCount = onThisDate.filter((s) => s.kind === 'mobility' && isDone(s)).length;

  const scheduled = profile.trainingDays.includes(weekday);
  const plannedWorkout = workouts.find((w) => w.kind === 'training' && w.day === weekday);
  const isFuture = date > today;
  const isToday = date === today;

  const nameOf = (id: string | null) => workouts.find((w) => w.id === id)?.name ?? null;

  if (training) {
    return {
      date,
      weekday,
      status: training.status === 'completed' ? 'completed' : 'partial',
      workoutName: nameOf(training.workoutId),
      sessionId: training.id,
      mobilityCount,
      isToday,
      isFuture,
    };
  }

  // A scheduled day that has already passed with nothing completed on it. This
  // covers both an explicitly abandoned session and a day the app never saw.
  if (scheduled && !isFuture && !isToday) {
    return {
      date,
      weekday,
      status: 'missed',
      workoutName: plannedWorkout?.name ?? null,
      sessionId: attempted?.id ?? null,
      mobilityCount,
      isToday,
      isFuture,
    };
  }

  if (scheduled) {
    return {
      date,
      weekday,
      status: 'planned',
      workoutName: plannedWorkout?.name ?? null,
      sessionId: attempted?.id ?? null,
      mobilityCount,
      isToday,
      isFuture,
    };
  }

  return {
    date,
    weekday,
    status: 'rest',
    workoutName: null,
    sessionId: null,
    mobilityCount,
    isToday,
    isFuture,
  };
};

/**
 * Whole weeks, most recent first, each starting on a Monday.
 *
 * Weeks rather than a month grid: a month boundary means nothing to a training
 * programme, and "3 of 4 this week" is the number that actually tells the
 * athlete how they are doing.
 */
export const historyWeeks = (args: HistoryArgs): CalendarWeek[] => {
  const { profile, today, weeks = 8 } = args;
  const thisWeek = weekStart(today);

  return Array.from({ length: weeks }, (_, index) => {
    const start = shift(thisWeek, -7 * index);
    const days = Array.from({ length: 7 }, (_, offset) => dayFor(shift(start, offset), args));

    return {
      start,
      days,
      completed: days.filter((d) => d.status === 'completed' || d.status === 'partial').length,
      planned: profile.trainingDays.length,
    };
  });
};

/** Every day in the history that has something to open. */
export const daysWithSessions = (weeks: CalendarWeek[]): CalendarDay[] =>
  weeks.flatMap((week) => week.days).filter((day) => day.sessionId !== null);
