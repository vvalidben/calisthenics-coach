import { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../../domain/profile';
import { dueReminder, type Reminder } from '../../domain/reminders';
import type { WorkoutSession } from '../../domain/session';
import type { Workout } from '../../domain/workout';
import type { Notifier } from '../../notifications/notifier';

interface UseRemindersArgs {
  profile: UserProfile;
  workouts: Workout[];
  sessions: WorkoutSession[];
  notifier: Notifier;
  /** Injected in tests. */
  clock?: () => Date;
  /** Whether the app is in the background. Injected in tests. */
  hidden?: () => boolean;
  intervalMs?: number;
}

/** A minute is as precise as a reminder needs to be, and costs nothing. */
const DEFAULT_INTERVAL_MS = 60_000;

const pageIsHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

/**
 * Watches the clock and delivers the day's reminder.
 *
 * Two deliveries, one decision. The returned reminder is drawn on the Today
 * screen and always works; the notification is sent **only when the app is in
 * the background**, because interrupting someone who is already looking at the
 * reminder is noise, not a nudge.
 *
 * It is a poll rather than a single timer set for 18:00: a timer that long is
 * throttled or dropped by every mobile browser, and a check once a minute is
 * honest about what this architecture can actually promise.
 */
export const useReminders = ({
  profile,
  workouts,
  sessions,
  notifier,
  clock,
  hidden,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseRemindersArgs): Reminder | null => {
  const [due, setDue] = useState<Reminder | null>(null);

  // Held in refs so a new inline function on each render cannot restart the
  // interval — the data below is what should restart it.
  const environment = useRef({ clock, hidden });
  useEffect(() => {
    environment.current = { clock, hidden };
  });

  /** The reminder ids already sent, so one day cannot notify twice. */
  const delivered = useRef(new Set<string>());

  useEffect(() => {
    const check = () => {
      const now = environment.current.clock?.() ?? new Date();
      const reminder = dueReminder({ profile, workouts, sessions, now });

      // Compared by id: a fresh object with the same meaning must not cause a
      // render, or this effect would restart itself forever.
      setDue((previous) => (previous?.id === reminder?.id ? previous : reminder));

      if (reminder === null) return;
      if (delivered.current.has(reminder.id)) return;
      if (!(environment.current.hidden?.() ?? pageIsHidden())) return;

      delivered.current.add(reminder.id);
      void notifier.show(reminder);
    };

    check();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [profile, workouts, sessions, notifier, intervalMs]);

  return due;
};
