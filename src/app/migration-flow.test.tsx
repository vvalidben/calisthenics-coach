import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { createRepositories } from '../storage/repositories';
import { PROGRAM } from '../content/program';
import { AppShell } from './AppShell';

/**
 * A store written by the app before `kind` existed: schema version 1, a
 * workout and a logged session with no kind on either.
 */
const seedVersionOneStore = async (adapter: MemoryAdapter) => {
  const monday = PROGRAM[0]!;
  const { kind: _kind, ...withoutKind } = monday;
  await adapter.set('meta:schemaVersion', 1);
  await adapter.set(`workout:${monday.id}`, { ...withoutKind, estimatedMinutes: 26 });
  await adapter.set('session:2026-09-14-foundation-w1-d1', {
    id: '2026-09-14-foundation-w1-d1',
    workoutId: monday.id,
    date: '2026-09-14',
    status: 'completed',
    startedAt: '2026-09-14T18:30:00.000Z',
    completedAt: '2026-09-14T18:56:00.000Z',
    durationSeconds: 1560,
    exercises: [],
    overallRpe: 6,
  });
};

describe('upgrading a store written before mobility existed', () => {
  it('opens without losing the old workout or session', async () => {
    const adapter = new MemoryAdapter();
    await seedVersionOneStore(adapter);

    render(
      <MemoryRouter>
        <AppShell adapter={adapter} today="2026-09-21" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });

  it('stamps the old records as training', async () => {
    const adapter = new MemoryAdapter();
    await seedVersionOneStore(adapter);

    render(
      <MemoryRouter>
        <AppShell adapter={adapter} today="2026-09-21" />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1 });

    const repos = createRepositories(adapter);
    const sessions = await repos.sessions.list();
    expect(sessions[0]!.kind).toBe('training');
  });

  it('keeps the athlete\u2019s own edits to that workout', async () => {
    const adapter = new MemoryAdapter();
    await seedVersionOneStore(adapter);
    const stored = await adapter.get<Record<string, unknown>>('workout:foundation-w1-d1');
    await adapter.set('workout:foundation-w1-d1', { ...stored, name: 'My Monday' });

    render(
      <MemoryRouter>
        <AppShell adapter={adapter} today="2026-09-21" />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1 });

    const workouts = await createRepositories(adapter).workouts.list();
    expect(workouts.find((w) => w.id === 'foundation-w1-d1')?.name).toBe('My Monday');
  });

  it('adds the new routines to the upgraded store', async () => {
    const adapter = new MemoryAdapter();
    await seedVersionOneStore(adapter);

    render(
      <MemoryRouter>
        <AppShell adapter={adapter} today="2026-09-21" />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { level: 1 });

    const workouts = await createRepositories(adapter).workouts.list();
    expect(workouts.filter((w) => w.kind === 'mobility')).toHaveLength(6);
  });
});
