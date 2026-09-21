import { localIsoDate, weekdayOf } from './calendar';
import type { UserProfile } from './profile';
import type { SessionStatus, WorkoutSession } from './session';
import { difficultyForRpe, type PerceivedDifficulty } from './session-log';

/**
 * The handful of numbers the dashboard shows.
 *
 * Deliberately few. A dashboard that answers "what do I do today" in one glance
 * is worth more than one that can answer anything given enough scrolling, so
 * nothing here exists unless it changes what the athlete does next.
 */

const COUNTS_AS_DONE: SessionStatus[] = ['completed', 'partial'];

const isDone = (session: WorkoutSession) => COUNTS_AS_DONE.includes(session.status);

const trainingSessions = (sessions: WorkoutSession[]) =>
  sessions.filter((s) => s.kind === 'training' && isDone(s));

const asDate = (iso: string) => new Date(`${iso}T12:00:00`);

const shift = (iso: string, days: number): string => {
  const date = asDate(iso);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
};

/** Monday of the week containing `today`. Weeks start on Monday, like the program. */
export const weekStart = (today: string): string => {
  const day = asDate(today).getDay();
  const backToMonday = day === 0 ? 6 : day - 1;
  return shift(today, -backToMonday);
};

export interface WeeklyProgress {
  completed: number;
  planned: number;
}

/** Training sessions done this week against the number scheduled. */
export const weeklyProgress = (
  sessions: WorkoutSession[],
  profile: UserProfile,
  today: string,
): WeeklyProgress => {
  const start = weekStart(today);
  const end = shift(start, 6);

  const completed = trainingSessions(sessions).filter(
    (s) => s.date >= start && s.date <= end,
  ).length;

  return { completed, planned: profile.trainingDays.length };
};

/**
 * Consecutive scheduled training days that were actually trained.
 *
 * Walking backward over scheduled days only, so a rest day never breaks a
 * streak. Today is forgiven if it has not happened yet — a streak that dies at
 * breakfast is a streak that discourages rather than motivates.
 */
export const currentStreak = (
  sessions: WorkoutSession[],
  profile: UserProfile,
  today: string,
): number => {
  const trained = new Set(trainingSessions(sessions).map((s) => s.date));
  const scheduled = new Set<string>(profile.trainingDays);

  let streak = 0;
  let cursor = today;

  // A year of lookback is far more history than this app will ever hold.
  for (let day = 0; day < 366; day += 1) {
    if (scheduled.has(weekdayOf(cursor))) {
      if (trained.has(cursor)) {
        streak += 1;
      } else if (cursor !== today) {
        break;
      }
    }
    cursor = shift(cursor, -1);
  }

  return streak;
};

/** Every training session ever finished. */
export const totalWorkouts = (sessions: WorkoutSession[]): number =>
  trainingSessions(sessions).length;

export interface RecentSession {
  id: string;
  workoutId: string | null;
  date: string;
  status: SessionStatus;
  difficulty: PerceivedDifficulty | null;
  totalReps: number;
  setsCompleted: number;
}

/** The last few training sessions, most recent first. */
export const recentPerformance = (
  sessions: WorkoutSession[],
  limit = 3,
): RecentSession[] =>
  trainingSessions(sessions)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((session) => ({
      id: session.id,
      workoutId: session.workoutId,
      date: session.date,
      status: session.status,
      difficulty: session.overallRpe === null ? null : difficultyForRpe(session.overallRpe),
      totalReps: session.exercises
        .flatMap((e) => e.sets)
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + (s.reps ?? 0), 0),
      setsCompleted: session.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length,
    }));
