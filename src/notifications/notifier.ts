import type { Reminder } from '../domain/reminders';

/**
 * Delivering a reminder.
 *
 * This is the only place in the app that touches a notification API, and it is
 * deliberately tiny: the decision about *what* to say and *when* it is due is
 * made by `domain/reminders.ts`, which has no idea a browser exists.
 *
 * What this cannot do, and does not claim to: wake the device. Everything here
 * runs inside the page, so a reminder is only delivered while the app is open.
 * See docs/ARCHITECTURE.md for what true push would require.
 */

/**
 * `unsupported` is its own state, kept separate from `denied`: a browser that
 * has no notifications is not the same as an athlete who said no, and the two
 * need different things said to them.
 */
export type NotificationAccess = 'granted' | 'denied' | 'default' | 'unsupported';

export interface Notifier {
  /** Whether this environment has a notification API at all. */
  readonly supported: boolean;
  permission(): NotificationAccess;
  /** Prompts the athlete. Only ever called from a button they pressed. */
  request(): Promise<NotificationAccess>;
  /** Returns whether anything was actually shown. Never guesses. */
  show(reminder: Reminder): Promise<boolean>;
}
