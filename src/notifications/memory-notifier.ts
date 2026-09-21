import type { Reminder } from '../domain/reminders';
import type { NotificationAccess, Notifier } from './notifier';

/**
 * A notifier that records instead of notifying.
 *
 * Used by tests, and as the fallback wherever notifications are unavailable:
 * the in-app reminder banner works the same either way, because it reads the
 * due reminder from the domain rather than from anything delivered.
 */
export class MemoryNotifier implements Notifier {
  readonly shown: Reminder[] = [];
  supported = true;

  constructor(private access: NotificationAccess = 'granted') {}

  permission(): NotificationAccess {
    return this.access;
  }

  async request(): Promise<NotificationAccess> {
    this.access = this.access === 'default' ? 'granted' : this.access;
    return this.access;
  }

  async show(reminder: Reminder): Promise<boolean> {
    if (this.access !== 'granted') return false;
    this.shown.push(reminder);
    return true;
  }
}
