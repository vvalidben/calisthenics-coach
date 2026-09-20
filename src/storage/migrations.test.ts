import { beforeEach, describe, expect, it } from 'vitest';
import { StorageKeys } from './adapter';
import { MemoryAdapter } from './memory-adapter';
import { CURRENT_SCHEMA_VERSION, runMigrations, type Migration } from './migrations';

let adapter: MemoryAdapter;

beforeEach(() => {
  adapter = new MemoryAdapter();
});

describe('runMigrations', () => {
  it('stamps a brand new store with the current schema version', async () => {
    await runMigrations(adapter);
    await expect(adapter.get(StorageKeys.schemaVersion)).resolves.toBe(CURRENT_SCHEMA_VERSION);
  });

  it('is idempotent', async () => {
    const applied: number[] = [];
    const migrations: Migration[] = [{ to: 2, migrate: async () => void applied.push(2) }];

    await runMigrations(adapter, migrations, 2);
    await runMigrations(adapter, migrations, 2);

    expect(applied).toEqual([2]);
  });

  it('applies pending migrations in ascending order', async () => {
    const applied: number[] = [];
    const migrations: Migration[] = [
      { to: 3, migrate: async () => void applied.push(3) },
      { to: 2, migrate: async () => void applied.push(2) },
      { to: 4, migrate: async () => void applied.push(4) },
    ];

    await runMigrations(adapter, migrations, 4);

    expect(applied).toEqual([2, 3, 4]);
  });

  it('skips migrations at or below the stored version', async () => {
    const applied: number[] = [];
    await adapter.set(StorageKeys.schemaVersion, 2);
    const migrations: Migration[] = [
      { to: 2, migrate: async () => void applied.push(2) },
      { to: 3, migrate: async () => void applied.push(3) },
    ];

    await runMigrations(adapter, migrations, 3);

    expect(applied).toEqual([3]);
  });

  it('leaves existing data untouched when nothing is pending', async () => {
    await adapter.set(StorageKeys.profile, { goals: ['build-muscle'] });
    await runMigrations(adapter);
    await runMigrations(adapter);
    await expect(adapter.get(StorageKeys.profile)).resolves.toEqual({ goals: ['build-muscle'] });
  });

  it('refuses to run against a store written by a newer version of the app', async () => {
    await adapter.set(StorageKeys.schemaVersion, 99);
    await expect(runMigrations(adapter)).rejects.toThrow(/newer version/i);
  });

  it('reports the version it ended on', async () => {
    const migrations: Migration[] = [{ to: 2, migrate: async () => {} }];
    await expect(runMigrations(adapter, migrations, 2)).resolves.toBe(2);
  });

  it('does not advance the stored version when a migration throws', async () => {
    const migrations: Migration[] = [
      {
        to: 2,
        migrate: async () => {
          throw new Error('boom');
        },
      },
    ];

    await expect(runMigrations(adapter, migrations, 2)).rejects.toThrow('boom');
    await expect(adapter.get(StorageKeys.schemaVersion)).resolves.toBe(1);
  });
});
