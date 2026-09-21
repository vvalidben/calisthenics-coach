import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PROGRAM } from '../../content/program';
import { finishSession, recordSet, startSession } from '../../domain/session-log';
import type { WorkoutSession } from '../../domain/session';
import { workoutBlocks } from '../../domain/workout';
import { WorkoutPlayer } from './WorkoutPlayer';

const MONDAY = PROGRAM[0]!;
const DATE = '2026-09-21';
const NOW = new Date('2026-09-21T18:30:00.000Z');

let saved: WorkoutSession[];
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
  saved = [];
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});

afterEach(() => {
  vi.useRealTimers();
});

const renderPlayer = (previous?: WorkoutSession) =>
  render(
    <MemoryRouter>
      <WorkoutPlayer
        workout={MONDAY}
        date={DATE}
        previousSession={previous}
        onSessionChange={(session) => saved.push(session)}
      />
    </MemoryRouter>,
  );

/** Log one set: finish it, accept the prefilled number, pick a difficulty. */
const logSet = async (difficulty = 'Moderate') => {
  await user.click(screen.getByRole('button', { name: /^finish set$/i }));
  await user.click(screen.getByRole('button', { name: difficulty }));
};

const skipRest = async () => {
  const skip = screen.queryByRole('button', { name: /skip rest/i });
  if (skip) await user.click(skip);
};

describe('starting a workout', () => {
  it('opens on the first exercise', () => {
    renderPlayer();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cat-Cow');
  });

  it('shows which set is coming and how many there are', () => {
    renderPlayer();
    expect(screen.getByText(/set 1 of 1/i)).toBeInTheDocument();
  });

  it('shows the target and the rest', () => {
    renderPlayer();
    expect(screen.getByTestId('player-target')).toHaveTextContent(/8.10 reps/i);
  });

  it('shows the coaching cue', () => {
    renderPlayer();
    expect(screen.getAllByText('Start from the tailbone.').length).toBeGreaterThan(0);
  });

  it('shows the demonstration', () => {
    renderPlayer();
    expect(screen.getByRole('img', { name: /cat-cow/i })).toBeInTheDocument();
  });

  it('links to the full instructions', () => {
    renderPlayer();
    expect(screen.getByRole('link', { name: /full instructions/i })).toHaveAttribute(
      'href',
      '/library/cat-cow',
    );
  });

  it('shows how far through the workout you are', () => {
    renderPlayer();
    expect(screen.getByText(/exercise 1 of 9/i)).toBeInTheDocument();
  });
});

describe('logging a set', () => {
  it('asks how many reps you completed', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /^finish set$/i }));
    expect(screen.getByLabelText(/how many reps did you complete/i)).toBeInTheDocument();
  });

  it('prefills the top of the target range so one tap is enough', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /^finish set$/i }));
    expect(screen.getByLabelText(/how many reps/i)).toHaveValue(10);
  });

  it('offers the five difficulty options', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /^finish set$/i }));
    for (const label of ['Easy', 'Moderate', 'Hard', 'Very hard', 'Failed']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('records what you entered', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /^finish set$/i }));
    await user.clear(screen.getByLabelText(/how many reps/i));
    await user.type(screen.getByLabelText(/how many reps/i), '9');
    await user.click(screen.getByRole('button', { name: 'Hard' }));

    const latest = saved.at(-1)!;
    const catCow = latest.exercises.find((e) => e.exerciseId === 'cat-cow')!;
    expect(catCow.sets[0]).toMatchObject({ reps: 9, rpe: 8, completed: true });
  });

  it('asks for seconds rather than reps on a timed exercise', async () => {
    renderPlayer();
    // Walk to the front plank, which is the sixth exercise and timed.
    for (let i = 0; i < 5; i += 1) {
      await user.click(screen.getByRole('button', { name: /start set/i }));
      const sets = i === 3 || i === 4 ? 3 : 1;
      for (let s = 0; s < sets; s += 1) {
        await logSet();
        await skipRest();
        if (s < sets - 1) await user.click(screen.getByRole('button', { name: /start set/i }));
      }
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Front Plank');
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /^finish set$/i }));
    expect(screen.getByLabelText(/how many seconds did you hold/i)).toBeInTheDocument();
  });

  it('saves after every set, so closing the app does not lose the workout', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    expect(saved).toHaveLength(1);
  });
});

describe('the rest timer', () => {
  /** Cat-Cow prescribes no rest at all, so step past it to reach one that does. */
  const reachAnExerciseWithRest = async () => {
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
  };

  it('starts after a set when the exercise prescribes rest', async () => {
    renderPlayer();
    await reachAnExerciseWithRest();
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('does not start when the exercise prescribes none', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('counts down in real time', async () => {
    renderPlayer();
    await reachAnExerciseWithRest();

    const before = screen.getByRole('timer').textContent;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('timer').textContent).not.toBe(before);
  });

  it('uses the rest the workout prescribes', async () => {
    renderPlayer();
    await reachAnExerciseWithRest();
    expect(screen.getByRole('timer')).toHaveTextContent('0:15');
  });

  it('moves on by itself when the rest runs out', async () => {
    renderPlayer();
    await reachAnExerciseWithRest();

    act(() => {
      vi.advanceTimersByTime(16000);
    });

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start set/i })).toBeInTheDocument();
  });

  it('can be skipped', async () => {
    renderPlayer();
    await reachAnExerciseWithRest();
    await user.click(screen.getByRole('button', { name: /skip rest/i }));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });
});

describe('reading the instructions without leaving the workout', () => {
  it('offers them on the exercise itself', () => {
    renderPlayer();
    expect(screen.getByText(/how to do it/i)).toBeInTheDocument();
  });

  it('starts closed, so the buttons stay where the thumb expects them', () => {
    renderPlayer();
    expect(screen.getByTestId('brief')).not.toHaveAttribute('open');
  });

  it('opens on a tap', async () => {
    renderPlayer();
    await user.click(screen.getByText(/how to do it/i));
    expect(screen.getByTestId('brief')).toHaveAttribute('open');
  });

  it('shows the numbered steps when opened', async () => {
    renderPlayer();
    await user.click(screen.getByText(/how to do it/i));

    const brief = within(screen.getByTestId('brief'));
    expect(brief.getByRole('list', { name: /the movement/i })).toBeInTheDocument();
  });

  it('shows the coaching cues', async () => {
    renderPlayer();
    await user.click(screen.getByText(/how to do it/i));

    const brief = within(screen.getByTestId('brief'));
    expect(brief.getByRole('list', { name: /think about/i })).toBeInTheDocument();
  });

  it('says what to stop for, which is the part that matters mid-set', async () => {
    renderPlayer();
    await user.click(screen.getByText(/how to do it/i));

    const brief = within(screen.getByTestId('brief'));
    expect(brief.getByText(/stop if/i)).toBeInTheDocument();
  });

  it('still offers the full page for everything it leaves out', async () => {
    renderPlayer();
    await user.click(screen.getByText(/how to do it/i));

    const brief = within(screen.getByTestId('brief'));
    expect(brief.getByRole('link', { name: /full instructions/i })).toHaveAttribute(
      'href',
      '/library/cat-cow',
    );
  });

  it('keeps the workout running underneath it', async () => {
    renderPlayer();
    await user.click(screen.getByText(/how to do it/i));
    expect(screen.getByRole('button', { name: /start set/i })).toBeInTheDocument();
  });
});

describe('coming back to an unfinished workout', () => {
  /** The whole warm-up done, plus `logged` sets of the first main exercise. */
  const halfDone = (logged: number): WorkoutSession => {
    let session = startSession(MONDAY, DATE, NOW.toISOString());

    for (const item of MONDAY.warmUp) {
      for (let i = 0; i < item.sets; i += 1) {
        session = recordSet(session, item.exerciseId, { reps: 9, difficulty: 'moderate' });
      }
    }
    for (let i = 0; i < logged; i += 1) {
      session = recordSet(session, MONDAY.mainWork[0]!.exerciseId, {
        reps: 9,
        difficulty: 'moderate',
      });
    }

    return session;
  };

  const firstMainIndex = MONDAY.warmUp.length;
  const items = workoutBlocks(MONDAY);

  const resumeFrom = (session: WorkoutSession) =>
    render(
      <MemoryRouter>
        <WorkoutPlayer
          workout={MONDAY}
          date={DATE}
          resume={session}
          onSessionChange={(next) => saved.push(next)}
        />
      </MemoryRouter>,
    );

  it('keeps the sets that were already logged', () => {
    resumeFrom(halfDone(1));
    expect(screen.getByTestId('player-set-count')).toHaveTextContent('Set 2 of');
  });

  it('moves on past the exercises that were finished', () => {
    resumeFrom(halfDone(0));
    expect(screen.getByText(`Exercise ${firstMainIndex + 1} of ${items.length}`)).toBeInTheDocument();
  });

  it('does not lose the earlier sets when the next one is logged', async () => {
    resumeFrom(halfDone(1));
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();

    const mainWork = saved.at(-1)!.exercises[firstMainIndex]!;
    expect(mainWork.sets).toHaveLength(2);
  });

  it('starts from the beginning when there is nothing to come back to', () => {
    renderPlayer();
    expect(screen.getByTestId('player-set-count')).toHaveTextContent('Set 1 of');
    expect(screen.getByText(/exercise 1 of/i)).toBeInTheDocument();
  });

  it('brings back the notes that were typed', () => {
    const session = { ...halfDone(1), notes: 'Left wrist a bit sore.' };
    resumeFrom(session);
    expect(saved).toEqual([]);
    expect(session.notes).toBe('Left wrist a bit sore.');
  });
});

describe('incomplete sets', () => {
  it('lets you skip a set you could not do', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /skip this set/i }));

    const catCow = saved.at(-1)!.exercises.find((e) => e.exerciseId === 'cat-cow')!;
    expect(catCow.sets[0]).toMatchObject({ completed: false, reps: null });
  });

  it('lets you end the workout early', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    await skipRest();
    await user.click(screen.getByRole('button', { name: /end workout/i }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workout complete/i);
  });

  it('records an early finish as partial rather than complete', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await logSet();
    await skipRest();
    await user.click(screen.getByRole('button', { name: /end workout/i }));

    expect(saved.at(-1)!.status).toBe('partial');
  });

  it('records a workout where nothing was completed as missed', async () => {
    renderPlayer();
    await user.click(screen.getByRole('button', { name: /start set/i }));
    await user.click(screen.getByRole('button', { name: /skip this set/i }));
    await skipRest();
    await user.click(screen.getByRole('button', { name: /end workout/i }));

    expect(saved.at(-1)!.status).toBe('missed');
  });
});

describe('finishing the workout', () => {
  /** Log every prescribed set of every exercise. */
  const completeEverything = async () => {
    for (let exercise = 0; exercise < 9; exercise += 1) {
      const heading = screen.getByRole('heading', { level: 1 });
      if (/workout complete/i.test(heading.textContent ?? '')) return;
      const setsText = screen.getByTestId('player-set-count').textContent ?? '';
      const total = Number(/of (\d+)/.exec(setsText)?.[1] ?? '1');
      for (let s = 0; s < total; s += 1) {
        await user.click(screen.getByRole('button', { name: /start set/i }));
        await logSet();
        await skipRest();
      }
    }
  };

  it('shows the completion screen at the end', async () => {
    renderPlayer();
    await completeEverything();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/workout complete/i);
  });

  it('records it as completed', async () => {
    renderPlayer();
    await completeEverything();
    expect(saved.at(-1)!.status).toBe('completed');
  });

  it('shows duration, exercises, sets, reps and difficulty', async () => {
    renderPlayer();
    await completeEverything();
    const summary = within(screen.getByRole('region', { name: /summary/i }));
    expect(summary.getByText(/duration/i)).toBeInTheDocument();
    expect(summary.getByText(/exercises/i)).toBeInTheDocument();
    expect(summary.getByText(/^sets$/i)).toBeInTheDocument();
    expect(summary.getByText(/total reps/i)).toBeInTheDocument();
    expect(summary.getByText(/difficulty/i)).toBeInTheDocument();
  });

  it('lets you leave a note', async () => {
    renderPlayer();
    await completeEverything();
    await user.type(screen.getByLabelText(/session notes/i), 'Shoulder felt tight.');
    expect(saved.at(-1)!.notes).toBe('Shoulder felt tight.');
  });

  it('says there is nothing to compare against on the first session', async () => {
    renderPlayer();
    await completeEverything();
    expect(screen.getByText(/first time/i)).toBeInTheDocument();
  });

  it('compares against the previous session when there is one', async () => {
    let previous = startSession(MONDAY, '2026-09-14', '2026-09-14T18:30:00.000Z');
    previous = recordSet(previous, 'push-up', { reps: 6, difficulty: 'hard' });
    previous = finishSession(previous, '2026-09-14T18:55:00.000Z');

    renderPlayer(previous);
    await completeEverything();

    const comparison = within(screen.getByRole('region', { name: /compared/i }));
    expect(comparison.getByText(/push-up/i)).toBeInTheDocument();
  });
});
