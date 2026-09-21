import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { AppShell } from './AppShell';

/**
 * The journeys end to end, in the order an athlete actually meets them.
 *
 * The screens each have their own tests. These are about what happens when one
 * step hands over to the next — the seams, which is where things break.
 */

const MONDAY = '2026-09-21';
const TUESDAY = '2026-09-22';
const NEXT_MONDAY = '2026-09-28';

let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-09-21T18:30:00.000Z'));
  adapter = new MemoryAdapter();
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
  vi.useRealTimers();
});

const openApp = (today = MONDAY) =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={today} />
    </MemoryRouter>,
  );

const heading = () => screen.getByRole('heading', { level: 1 }).textContent ?? '';

/** Log the set in front of you, optionally overriding the number performed. */
const logSet = async (difficulty = 'Moderate', value?: number) => {
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));

  if (value !== undefined) {
    const entry = screen.getByLabelText(/how many (reps|seconds)/i);
    await user.clear(entry);
    await user.type(entry, String(value));
  }

  await user.click(screen.getByRole('button', { name: difficulty }));
  const rest = screen.queryByRole('button', { name: /skip rest/i });
  if (rest) await user.click(rest);
};

const playEverything = async (difficulty = 'Moderate', value?: number) => {
  for (let exercise = 0; exercise < 9; exercise += 1) {
    if (/workout complete/i.test(heading())) return;

    const setsText = screen.getByTestId('player-set-count').textContent ?? '';
    const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');

    for (let s = 0; s < total; s += 1) {
      await user.click(screen.getByRole('button', { name: /start set/i }));
      await logSet(difficulty, value);
    }
  }
};

const trainToday = async (today: string, difficulty = 'Moderate', value?: number) => {
  const view = openApp(today);
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('link', { name: /start workout/i }));
  await playEverything(difficulty, value);
  return view;
};

const goTo = async (tab: RegExp) => {
  await user.click(screen.getByRole('link', { name: tab }));
  await screen.findByRole('heading', { level: 1 });
};

const mondayPushUp = async () => {
  const workouts = await createRepositories(adapter).workouts.list();
  return workouts.find((w) => w.id === 'foundation-w1-d1')!.mainWork[0]!;
};

describe('a new athlete, from opening the app to finishing their first session', () => {
  it('lands on today with one thing to do', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    expect(heading()).toBe('Push and Core');
    expect(screen.getByRole('link', { name: /start workout/i })).toBeInTheDocument();
  });

  it('can read how to do an exercise before committing to anything', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await goTo(/^exercises$/i);
    await user.click(screen.getByRole('link', { name: /^push-up/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /push-up/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /starting position/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /breathing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /safety/i })).toBeInTheDocument();
  });

  it('sees a demonstration alongside the words, never instead of them', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await goTo(/^exercises$/i);
    await user.click(screen.getByRole('link', { name: /^push-up/i }));

    await screen.findByRole('heading', { level: 1, name: /push-up/i });
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: /sequence/i })).toBeInTheDocument();
  });

  it('finishes the session and is told what it meant', async () => {
    await trainToday(MONDAY);
    expect(heading()).toMatch(/workout complete/i);
    expect(screen.getByTestId('coach-headline')).toBeInTheDocument();
  });

  it('finds the progress updated afterwards', async () => {
    const session = await trainToday(MONDAY);
    await user.click(screen.getByRole('link', { name: /^done$/i }));
    session.unmount();

    openApp(TUESDAY);
    await screen.findByRole('heading', { level: 1 });

    expect(await screen.findByTestId('stat-total')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-streak')).toHaveTextContent('1');
  });

  it('finds the session on the calendar', async () => {
    const session = await trainToday(MONDAY);
    await user.click(screen.getByRole('link', { name: /^done$/i }));
    session.unmount();

    openApp(TUESDAY);
    await screen.findByRole('heading', { level: 1 });
    await goTo(/^history$/i);

    const week = within(await screen.findByRole('region', { name: /week of 21 sep/i }));
    expect(week.getByRole('listitem', { name: /monday/i })).toHaveTextContent(/done/i);
  });

  it('finds the phase criteria moved on', async () => {
    const session = await trainToday(MONDAY);
    await user.click(screen.getByRole('link', { name: /^done$/i }));
    session.unmount();

    openApp(TUESDAY);
    await screen.findByRole('heading', { level: 1 });
    await goTo(/^progress$/i);

    const phase = within(await screen.findByRole('region', { name: /training phase/i }));
    expect(phase.getByRole('listitem', { name: /12 sessions/i })).toHaveTextContent('1 of 12');
  });
});

describe('a workout that was missed', () => {
  /** Monday goes by untrained; the athlete opens the app on Tuesday. */
  const skipMonday = async () => {
    openApp(TUESDAY);
    await screen.findByRole('heading', { level: 1 });
  };

  it('is marked missed on the calendar without being asked about', async () => {
    await skipMonday();
    await goTo(/^history$/i);

    const week = within(await screen.findByRole('region', { name: /week of 21 sep/i }));
    expect(week.getByRole('listitem', { name: /monday/i })).toHaveTextContent(/missed/i);
  });

  it('is never moved to another day', async () => {
    await skipMonday();
    expect(heading()).toBe('Legs and Mobility');
    expect(screen.queryByText(/push and core/i)).not.toBeInTheDocument();
  });

  it('leaves the next workout exactly as it was', async () => {
    await skipMonday();
    expect((await mondayPushUp()).target).toEqual({ min: 6, max: 10 });
  });

  it('says nothing about it at all on the dashboard', async () => {
    await skipMonday();
    expect(screen.queryByText(/missed/i)).not.toBeInTheDocument();
  });

  it('breaks the streak rather than pretending otherwise', async () => {
    await skipMonday();
    expect(screen.getByTestId('stat-streak')).toHaveTextContent('0');
  });
});

describe('progression, earned over two sessions', () => {
  it('changes nothing after the first clean one', async () => {
    const first = await trainToday(MONDAY);
    first.unmount();
    expect((await mondayPushUp()).target).toEqual({ min: 6, max: 10 });
  });

  it('raises the target after the second', async () => {
    const first = await trainToday(MONDAY);
    first.unmount();
    const second = await trainToday(NEXT_MONDAY);
    second.unmount();

    expect((await mondayPushUp()).target).toEqual({ min: 7, max: 11 });
  });

  it('carries the new target into the session itself', async () => {
    const first = await trainToday(MONDAY);
    first.unmount();
    const second = await trainToday(NEXT_MONDAY);
    second.unmount();

    openApp('2026-10-05');
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /start workout/i }));

    while (!/push-up/i.test(heading())) {
      const setsText = screen.getByTestId('player-set-count').textContent ?? '';
      const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');
      for (let s = 0; s < total; s += 1) {
        await user.click(screen.getByRole('button', { name: /start set/i }));
        await logSet();
      }
    }

    expect(screen.getByTestId('player-target')).toHaveTextContent(/7.11 reps/i);
  });
});

describe('regression, after repeatedly falling short', () => {
  /** Three reps against a target of six to ten: short, every set. */
  const struggleThrough = (today: string) => trainToday(today, 'Very hard', 3);

  it('holds everything steady after one bad session', async () => {
    const first = await struggleThrough(MONDAY);
    first.unmount();

    const pushUp = await mondayPushUp();
    expect(pushUp.exerciseId).toBe('push-up');
    expect(pushUp.target).toEqual({ min: 6, max: 10 });
  });

  it('says plainly that one session is not a trend', async () => {
    await struggleThrough(MONDAY);
    expect(screen.getByTestId('coach-advice')).toHaveTextContent(/not a trend/i);
  });

  it('steps back to an easier variation after the second', async () => {
    const first = await struggleThrough(MONDAY);
    first.unmount();
    const second = await struggleThrough(NEXT_MONDAY);
    second.unmount();

    expect((await mondayPushUp()).exerciseId).toBe('knee-push-up');
  });

  it('starts the easier variation at its own prescription, not the old one', async () => {
    const first = await struggleThrough(MONDAY);
    first.unmount();
    const second = await struggleThrough(NEXT_MONDAY);
    second.unmount();

    const pushUp = await mondayPushUp();
    expect(pushUp.target.max).toBeGreaterThan(0);
    expect(pushUp.sets).toBeGreaterThan(0);
  });

  it('explains the step back rather than just doing it', async () => {
    const first = await struggleThrough(MONDAY);
    first.unmount();
    await struggleThrough(NEXT_MONDAY);

    // Everything fell short twice, so several exercises step back together.
    const next = within(screen.getByRole('region', { name: /next time/i }));
    const explanations = next.getAllByText(/stepping back to/i).map((el) => el.textContent);
    expect(explanations.some((text) => /Push-Up.*Knee Push-Up|Knee Push-Up/i.test(text ?? ''))).toBe(
      true,
    );
  });
});
