import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserNotifier } from './browser-notifier';
import type { Reminder } from '../domain/reminders';

const reminder: Reminder = {
  id: 'training:2026-09-21',
  date: '2026-09-21',
  kind: 'training',
  at: '18:00',
  workoutId: 'w-mon',
  title: "Today's workout is ready",
  body: "25 minutes of Push and Core. Start when you're ready.",
};

interface FakeNotification {
  title: string;
  options: NotificationOptions | undefined;
}

const shown: FakeNotification[] = [];
let requested = 0;

/** Stands in for the browser's Notification API, which jsdom does not provide. */
const installNotificationApi = (permission: NotificationPermission, grants = permission) => {
  const constructor = function (this: unknown, title: string, options?: NotificationOptions) {
    shown.push({ title, options });
  } as unknown as typeof Notification;

  Object.defineProperty(constructor, 'permission', { value: permission, configurable: true });
  Object.defineProperty(constructor, 'requestPermission', {
    value: async () => {
      requested += 1;
      return grants;
    },
    configurable: true,
  });

  vi.stubGlobal('Notification', constructor);
};

beforeEach(() => {
  shown.length = 0;
  requested = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a browser that cannot show notifications', () => {
  beforeEach(() => {
    vi.stubGlobal('Notification', undefined);
  });

  it('says so rather than pretending', () => {
    expect(new BrowserNotifier().supported).toBe(false);
  });

  it('reports its permission as unsupported', () => {
    expect(new BrowserNotifier().permission()).toBe('unsupported');
  });

  it('asking for permission changes nothing', async () => {
    await expect(new BrowserNotifier().request()).resolves.toBe('unsupported');
  });

  it('reports honestly that nothing was shown', async () => {
    await expect(new BrowserNotifier().show(reminder)).resolves.toBe(false);
  });
});

describe('before permission has been asked for', () => {
  beforeEach(() => {
    installNotificationApi('default', 'granted');
  });

  it('is supported', () => {
    expect(new BrowserNotifier().supported).toBe(true);
  });

  it('reports that nothing has been decided', () => {
    expect(new BrowserNotifier().permission()).toBe('default');
  });

  it('shows nothing, because asking mid-reminder would be rude', async () => {
    await new BrowserNotifier().show(reminder);
    expect(shown).toHaveLength(0);
  });

  it('asks the browser when the athlete asks it to', async () => {
    await expect(new BrowserNotifier().request()).resolves.toBe('granted');
    expect(requested).toBe(1);
  });
});

describe('when permission has been refused', () => {
  beforeEach(() => {
    installNotificationApi('denied');
  });

  it('reports the refusal', () => {
    expect(new BrowserNotifier().permission()).toBe('denied');
  });

  it('shows nothing', async () => {
    expect(await new BrowserNotifier().show(reminder)).toBe(false);
    expect(shown).toHaveLength(0);
  });
});

describe('when permission has been granted', () => {
  beforeEach(() => {
    installNotificationApi('granted');
  });

  it('shows the reminder', async () => {
    expect(await new BrowserNotifier().show(reminder)).toBe(true);
    expect(shown).toHaveLength(1);
  });

  it('uses the reminder as its own words', () => {
    void new BrowserNotifier().show(reminder);
    expect(shown[0]?.title).toBe("Today's workout is ready");
    expect(shown[0]?.options?.body).toBe("25 minutes of Push and Core. Start when you're ready.");
  });

  it('tags it with the reminder id, so the same day cannot stack up', async () => {
    await new BrowserNotifier().show(reminder);
    await new BrowserNotifier().show(reminder);
    expect(shown.every((n) => n.options?.tag === 'training:2026-09-21')).toBe(true);
  });

  it('does not make a sound or vibrate: this is a nudge, not an alarm', async () => {
    await new BrowserNotifier().show(reminder);
    expect(shown[0]?.options?.silent).toBe(true);
  });

  it('survives a browser that throws when constructing one', async () => {
    vi.stubGlobal(
      'Notification',
      Object.defineProperties(
        function () {
          throw new TypeError('Illegal constructor.');
        } as unknown as typeof Notification,
        {
          permission: { value: 'granted', configurable: true },
          requestPermission: { value: async () => 'granted', configurable: true },
        },
      ),
    );

    await expect(new BrowserNotifier().show(reminder)).resolves.toBe(false);
  });
});
