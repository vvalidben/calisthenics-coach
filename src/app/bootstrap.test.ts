import { beforeEach, describe, expect, it } from 'vitest';
import { StorageKeys } from '../storage/adapter';
import { MemoryAdapter } from '../storage/memory-adapter';
import { CURRENT_SCHEMA_VERSION } from '../storage/migrations';
import { SEED_PROFILE } from '../content/seed-profile';
import { bootstrap } from './bootstrap';

let adapter: MemoryAdapter;

beforeEach(() => {
  adapter = new MemoryAdapter();
});

describe('bootstrap', () => {
  it('brings a fresh store up to the current schema version', async () => {
    await bootstrap(adapter);
    await expect(adapter.get(StorageKeys.schemaVersion)).resolves.toBe(CURRENT_SCHEMA_VERSION);
  });

  it('seeds the athlete profile on first run', async () => {
    const { profile } = await bootstrap(adapter);
    expect(profile).toEqual(SEED_PROFILE);
  });

  it('seeds a progression state for every family on first run', async () => {
    const { progression } = await bootstrap(adapter);
    expect(progression).toHaveLength(9);
  });

  it('reports that it seeded on the first run and not on the second', async () => {
    await expect(bootstrap(adapter)).resolves.toMatchObject({ seeded: true });
    await expect(bootstrap(adapter)).resolves.toMatchObject({ seeded: false });
  });

  it('does not overwrite a profile the athlete has already edited', async () => {
    const { repositories } = await bootstrap(adapter);
    await repositories.profile.save({ ...SEED_PROFILE, progressionRate: 'aggressive' });

    const { profile } = await bootstrap(adapter);

    expect(profile.progressionRate).toBe('aggressive');
  });

  it('does not overwrite progression state that already exists', async () => {
    const { repositories } = await bootstrap(adapter);
    const push = (await repositories.progression.get('push'))!;
    await repositories.progression.save({ ...push, consecutiveQualifyingSessions: 2 });

    await bootstrap(adapter);

    const reloaded = await repositories.progression.get('push');
    expect(reloaded?.consecutiveQualifyingSessions).toBe(2);
  });

  it('leaves logged sessions untouched', async () => {
    await bootstrap(adapter);
    await adapter.set(StorageKeys.session('2026-09-21'), { anything: true });

    await bootstrap(adapter);

    await expect(adapter.get(StorageKeys.session('2026-09-21'))).resolves.toEqual({
      anything: true,
    });
  });

  it('hands back repositories wired to the same store', async () => {
    const { repositories } = await bootstrap(adapter);
    await expect(repositories.profile.load()).resolves.toEqual(SEED_PROFILE);
  });

  it('refuses to run against data written by a newer version of the app', async () => {
    await adapter.set(StorageKeys.schemaVersion, 99);
    await expect(bootstrap(adapter)).rejects.toThrow(/newer version/i);
  });
});
