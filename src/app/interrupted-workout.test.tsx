import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { AppShell } from './AppShell';

/**
 * A workout interrupted part-way through.
 *
 * The player writes after every set precisely so a closed tab, a dead battery
 * or a stray back gesture costs at most the set in progress. That promise only
 * holds if reopening the workout picks the session back up instead of starting
 * a new one over the top of it.
 */

const MONDAY = '2026-09-21';

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

const openApp = () =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={MONDAY} />
    </MemoryRouter>,
  );

const logSet = async () => {
  await user.click(screen.getByRole('button', { name: /start set/i }));
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  await user.click(screen.getByRole('button', { name: 'Moderate' }));
  const rest = screen.queryByRole('button', { name: /skip rest/i });
  if (rest) await user.click(rest);
};

const startWorkout = async () => {
  openApp();
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('link', { name: /start workout/i }));
};

const setsLogged = async () => {
  const sessions = await createRepositories(adapter).sessions.list();
  return sessions.flatMap((s) => s.exercises).flatMap((e) => e.sets).length;
};

describe('walking away mid-workout', () => {
  it('keeps every set that was logged', async () => {
    const first = await startWorkoutAndLog(3);
    first.unmount();

    await startWorkout();
    expect(await setsLogged()).toBe(3);
  });

  it('picks up where it stopped rather than starting again', async () => {
    const first = await startWorkoutAndLog(1);
    first.unmount();

    await startWorkout();
    expect(screen.getByText(/exercise 2 of/i)).toBeInTheDocument();
  });

  it('adds to the same session instead of opening a second one', async () => {
    const first = await startWorkoutAndLog(2);
    first.unmount();

    await startWorkout();
    await logSet();

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions).toHaveLength(1);
    expect(await setsLogged()).toBe(3);
  });

  it('still finishes the workout it resumed', async () => {
    const first = await startWorkoutAndLog(2);
    first.unmount();

    await startWorkout();
    await user.click(screen.getByRole('button', { name: /end workout/i }));

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions[0]!.status).toBe('partial');
  });

});

describe('a workout that is already finished for the day', () => {
  const endAfterOneSet = async () => {
    const view = await startWorkoutAndLog(1);
    await user.click(screen.getByRole('button', { name: /end workout/i }));
    view.unmount();
  };

  it('is not offered again on the dashboard', async () => {
    await endAfterOneSet();

    openApp();
    // The stored sessions arrive a tick after the first paint.
    await screen.findByRole('heading', { level: 1, name: /partly done today/i });
    expect(screen.queryByRole('link', { name: /start workout/i })).not.toBeInTheDocument();
  });

  it('refuses to reopen the player, even from the address bar', async () => {
    await endAfterOneSet();

    render(
      <MemoryRouter initialEntries={['/workout/foundation-w1-d1']}>
        <AppShell adapter={adapter} today={MONDAY} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: /already done/i })).toBeInTheDocument();
    expect(screen.queryByTestId('player-set-count')).not.toBeInTheDocument();
  });

  it('offers to show what was logged instead', async () => {
    await endAfterOneSet();

    render(
      <MemoryRouter initialEntries={['/workout/foundation-w1-d1']}>
        <AppShell adapter={adapter} today={MONDAY} />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { level: 1, name: /already done/i });
    expect(screen.getByRole('link', { name: /see what you did/i })).toHaveAttribute(
      'href',
      `/history/${MONDAY}-foundation-w1-d1`,
    );
  });

  it('keeps what was logged, rather than starting a new record over it', async () => {
    await endAfterOneSet();

    render(
      <MemoryRouter initialEntries={['/workout/foundation-w1-d1']}>
        <AppShell adapter={adapter} today={MONDAY} />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1, name: /already done/i });

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.status).toBe('partial');
    expect(await setsLogged()).toBe(1);
  });
});

/** Opens the workout and logs `count` sets, leaving it unfinished. */
async function startWorkoutAndLog(count: number) {
  const view = openApp();
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('link', { name: /start workout/i }));
  for (let i = 0; i < count; i += 1) await logSet();
  return view;
}
