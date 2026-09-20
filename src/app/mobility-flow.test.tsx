import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { AppShell } from './AppShell';

const MONDAY = '2026-09-21';
const WEDNESDAY = '2026-09-23';

let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-09-23T09:00:00.000Z'));
  adapter = new MemoryAdapter();
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
  vi.useRealTimers();
});

const openApp = (today = WEDNESDAY) =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={today} />
    </MemoryRouter>,
  );

const logSet = async () => {
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  await user.click(screen.getByRole('button', { name: 'Easy' }));
  const skip = screen.queryByRole('button', { name: /skip rest/i });
  if (skip) await user.click(skip);
};

const playRoutine = async () => {
  for (let exercise = 0; exercise < 8; exercise += 1) {
    if (/workout complete/i.test(screen.getByRole('heading', { level: 1 }).textContent ?? '')) {
      return;
    }
    const setsText = screen.getByTestId('player-set-count').textContent ?? '';
    const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');
    for (let s = 0; s < total; s += 1) {
      await user.click(screen.getByRole('button', { name: /start set/i }));
      await logSet();
    }
  }
};

describe('mobility routines on a rest day', () => {
  it('offers them without making them feel compulsory', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });

    const routines = within(screen.getByRole('region', { name: /optional mobility/i }));
    expect(routines.getByText(/skipping it costs you nothing/i)).toBeInTheDocument();
  });

  it('lists one for each area plus the reset', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });

    const routines = within(screen.getByRole('region', { name: /optional mobility/i }));
    for (const name of ['Shoulders', 'Thoracic Spine', 'Hips', 'Hamstrings', 'Ankles', 'Full Reset']) {
      expect(routines.getByRole('link', { name: new RegExp(name, 'i') })).toBeInTheDocument();
    }
  });

  it('shows how long each one takes', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: /ankles/i })).toHaveTextContent(/6 min/i);
  });

  it('is also offered on a training day', async () => {
    openApp(MONDAY);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('region', { name: /optional mobility/i })).toBeInTheDocument();
  });
});

describe('playing a routine', () => {
  const start = async (name: RegExp) => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name }));
  };

  it('opens in the same player as a workout', async () => {
    await start(/ankles/i);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ankle Circles');
  });

  it('still links each position to its full instructions', async () => {
    await start(/ankles/i);
    expect(screen.getByRole('link', { name: /how to do it/i })).toHaveAttribute(
      'href',
      '/library/ankle-circles',
    );
  });

  it('runs to completion', async () => {
    await start(/ankles/i);
    await playRoutine();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workout complete/i);
  });

  it('saves the session as mobility, not training', async () => {
    await start(/ankles/i);
    await playRoutine();

    const sessions = await createRepositories(adapter).sessions.list();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      workoutId: 'mobility-ankles',
      kind: 'mobility',
      status: 'completed',
    });
  });

  it('changes nothing about the training program', async () => {
    await start(/ankles/i);
    await playRoutine();

    expect(screen.getByText(/nothing logged, so nothing changes/i)).toBeInTheDocument();

    const workouts = await createRepositories(adapter).workouts.list();
    const monday = workouts.find((w) => w.id === 'foundation-w1-d1')!;
    expect(monday.mainWork.find((i) => i.exerciseId === 'push-up')!.target).toEqual({
      min: 6,
      max: 10,
    });
  });

  it('leaves the progression counters untouched', async () => {
    await start(/ankles/i);
    await playRoutine();

    const states = await createRepositories(adapter).progression.list();
    const ankle = states.find((s) => s.family === 'ankle-mobility')!;
    expect(ankle.consecutiveQualifyingSessions).toBe(0);
  });

  it('counts toward the mobility tally shown on Today', async () => {
    await start(/ankles/i);
    await playRoutine();
    await user.click(screen.getByRole('link', { name: /^done$/i }));

    const view = openApp();
    expect(await view.findByText(/1 done in the last seven days/i)).toBeInTheDocument();
  });
});
