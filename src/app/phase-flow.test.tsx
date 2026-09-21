import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import type { SessionExercise, SessionSet, WorkoutSession } from '../domain/session';
import { AppShell } from './AppShell';

/** The Monday four weeks after the seeded phase began. */
const TODAY = '2026-10-19';

let adapter: MemoryAdapter;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-10-19T18:30:00.000Z'));
  adapter = new MemoryAdapter();
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
  vi.useRealTimers();
});

const reps = (count: number, value: number): SessionSet[] =>
  Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps: value,
    seconds: null,
    rpe: 6 as const,
    completed: true,
  }));

const held = (count: number, seconds: number): SessionSet[] =>
  Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps: null,
    seconds,
    rpe: 6 as const,
    completed: true,
  }));

/** Every Foundation benchmark, met cleanly. */
const benchmarkWork: SessionExercise[] = [
  {
    exerciseId: 'push-up',
    block: 'main',
    prescribed: { sets: 3, measurement: 'reps', target: { min: 6, max: 10 } },
    sets: reps(3, 10),
    rpe: 6,
  },
  {
    exerciseId: 'bodyweight-squat',
    block: 'main',
    prescribed: { sets: 3, measurement: 'reps', target: { min: 12, max: 16 } },
    sets: reps(3, 16),
    rpe: 6,
  },
  {
    exerciseId: 'front-plank',
    block: 'main',
    prescribed: { sets: 3, measurement: 'time', target: { min: 20, max: 45 } },
    sets: held(3, 45),
    rpe: 6,
  },
];

/**
 * Eleven finished sessions inside the phase, written straight to the store.
 *
 * Playing eleven workouts through the UI would test the player, which has its
 * own tests. What matters here is what the history adds up to.
 */
const ELEVEN_DATES = [
  '2026-09-22',
  '2026-09-24',
  '2026-09-26',
  '2026-09-28',
  '2026-09-29',
  '2026-10-01',
  '2026-10-03',
  '2026-10-05',
  '2026-10-06',
  '2026-10-08',
  '2026-10-10',
];

const seedHistory = async (dates: string[] = ELEVEN_DATES, exercises = benchmarkWork) => {
  const repositories = createRepositories(adapter);
  for (const date of dates) {
    const session: WorkoutSession = {
      id: `${date}-foundation-w1-d1`,
      workoutId: 'foundation-w1-d1',
      kind: 'training',
      date,
      status: 'completed',
      startedAt: `${date}T18:00:00.000Z`,
      completedAt: `${date}T18:25:00.000Z`,
      durationSeconds: 1500,
      exercises,
      overallRpe: 6,
    };
    await repositories.sessions.save(session);
  }
};

const openApp = (today = TODAY) =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today={today} />
    </MemoryRouter>,
  );

const logSet = async () => {
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  await user.click(screen.getByRole('button', { name: 'Moderate' }));
  const skip = screen.queryByRole('button', { name: /skip rest/i });
  if (skip) await user.click(skip);
};

const playEverything = async () => {
  for (let exercise = 0; exercise < 9; exercise += 1) {
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

const runSession = async () => {
  const view = openApp();
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('link', { name: /start workout/i }));
  await playEverything();
  return view;
};

const storedPhase = async () => (await createRepositories(adapter).profile.load())?.currentPhase;

describe('where the athlete starts', () => {
  it('begins in Foundation', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByTestId('stat-phase')).toHaveTextContent(/foundation/i);
  });

  it('says what Foundation is for', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByText(/technique and consistency/i)).toBeInTheDocument();
  });

  it('shows what is left to do, on the Pathways screen', async () => {
    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /^pathways$/i }));

    const phase = within(await screen.findByRole('region', { name: /training phase/i }));
    expect(phase.getByRole('listitem', { name: /12 sessions/i })).toHaveTextContent('0 of 12');
  });
});

describe('earning the next phase', () => {
  it('stays in Foundation while the criteria are unmet', async () => {
    await seedHistory(ELEVEN_DATES.slice(0, 4));
    await runSession();
    expect((await storedPhase())?.name).toBe('foundation');
  });

  it('moves on once the last session completes the criteria', async () => {
    await seedHistory();
    await runSession();
    expect((await storedPhase())?.name).toBe('strength-building');
  });

  it('starts the new phase today, so its criteria are measured from now', async () => {
    await seedHistory();
    await runSession();
    expect((await storedPhase())?.startedAt).toBe(TODAY);
  });

  it('will not move on when the work was there but the technique was not', async () => {
    // Every benchmark met, but each exercise fading badly across its sets.
    const fading: SessionExercise[] = benchmarkWork.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((s, i) => ({
        ...s,
        reps: s.reps === null ? null : s.reps - i * 3,
        seconds: s.seconds === null ? null : s.seconds - i * 12,
      })),
    }));
    await seedHistory(ELEVEN_DATES, fading);
    await runSession();
    expect((await storedPhase())?.name).toBe('foundation');
  });

  it('will not move on from time alone', async () => {
    // A year in the phase, with nothing logged in it.
    const first = openApp();
    await screen.findByRole('heading', { level: 1 });
    first.unmount();

    const repositories = createRepositories(adapter);
    const profile = (await repositories.profile.load())!;
    await repositories.profile.save({
      ...profile,
      currentPhase: { ...profile.currentPhase, startedAt: '2025-01-01' },
    });

    await runSession();
    expect((await storedPhase())?.name).toBe('foundation');
  });
});

describe('the phase, once earned', () => {
  it('shows on the dashboard by its own name', async () => {
    await seedHistory();
    const session = await runSession();
    session.unmount();

    openApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByTestId('stat-phase')).toHaveTextContent(/strength development/i);
  });

  it('survives closing the app', async () => {
    await seedHistory();
    const session = await runSession();
    session.unmount();

    // A second, entirely fresh mount reading the same store.
    openApp('2026-10-20');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByTestId('stat-phase')).toHaveTextContent(/strength development/i);
  });

  it('asks for the next phase criteria rather than the old ones', async () => {
    await seedHistory();
    const session = await runSession();
    session.unmount();

    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /^pathways$/i }));

    const phase = within(await screen.findByRole('region', { name: /training phase/i }));
    expect(phase.getByRole('heading', { level: 2 })).toHaveTextContent(/strength development/i);
    expect(phase.getByRole('listitem', { name: /16 sessions/i })).toBeInTheDocument();
  });

  it('counts from the day the phase began, which is today', async () => {
    await seedHistory();
    const session = await runSession();
    session.unmount();

    openApp();
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('link', { name: /^pathways$/i }));

    const phase = within(await screen.findByRole('region', { name: /training phase/i }));
    // The session that earned the phase was trained on its first day, so it
    // counts toward it. One session either way changes nothing that matters.
    expect(phase.getByRole('listitem', { name: /16 sessions/i })).toHaveTextContent('1 of 16');
  });

  it('does not skip a phase, however far ahead the athlete is', async () => {
    await seedHistory();
    const session = await runSession();
    session.unmount();

    expect((await storedPhase())?.name).toBe('strength-building');
  });
});
