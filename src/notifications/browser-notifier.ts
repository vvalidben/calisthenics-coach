import type { Reminder } from '../domain/reminders';
import type { NotificationAccess, Notifier } from './notifier';

/**
 * The real notifier: the browser's own Notification API.
 *
 * It only fires while the page is open. There is no server, no push service
 * and no subscription, so nothing here can reach a closed app — and the app
 * says so in Settings rather than letting the athlete assume otherwise.
 */
export class BrowserNotifier implements Notifier {
  get supported(): boolean {
    return typeof Notification !== 'undefined';
  }

  permission(): NotificationAccess {
    if (!this.supported) return 'unsupported';
    return Notification.permission;
  }

  async request(): Promise<NotificationAccess> {
    if (!this.supported) return 'unsupported';
    return Notification.requestPermission();
  }

  async show(reminder: Reminder): Promise<boolean> {
    if (this.permission() !== 'granted') return false;

    try {
      new Notification(reminder.title, {
        body: reminder.body,
        // The day's own id: a second attempt replaces the first rather than
        // stacking another copy on top of it.
        tag: reminder.id,
        silent: true,
      });
      return true;
    } catch {
      // Some browsers refuse the constructor outright and require a service
      // worker registration instead. Report the failure rather than claim a
      // notification the athlete never saw.
      return false;
    }
  }
}
