import { StorageKeys, StoragePrefixes, type StorageAdapter } from './adapter';

/**
 * Bump this whenever a stored shape changes, and add the matching migration
 * below. Version 1 is the baseline introduced in Sprint 1.
 */
export const CURRENT_SCHEMA_VERSION = 2;

export interface Migration {
  /** The schema version this migration produces. */
  to: number;
  migrate: (adapter: StorageAdapter) => Promise<void>;
}

/**
 * Migrations for the real store.
 *
 * Version 2 introduced `kind` on workouts and sessions so mobility can be
 * counted separately from training. Anything already stored predates the idea
 * and is therefore training.
 */
export const MIGRATIONS: Migration[] = [
  {
    to: 2,
    async migrate(adapter) {
      const stamp = async (prefix: string) => {
        for (const key of await adapter.keys(prefix)) {
          const record = await adapter.get<Record<string, unknown>>(key);
          if (record && record['kind'] === undefined) {
            await adapter.set(key, { ...record, kind: 'training' });
          }
        }
      };
      await stamp(StoragePrefixes.workout);
      await stamp(StoragePrefixes.session);
    },
  },
];

/**
 * Brings a store up to `target`, applying each pending migration in ascending
 * order and stamping the version after each success. Returns the version the
 * store ended on.
 *
 * A failed migration leaves the version at the last one that succeeded, so a
 * retry resumes rather than restarts.
 */
export const runMigrations = async (
  adapter: StorageAdapter,
  migrations: Migration[] = MIGRATIONS,
  target: number = CURRENT_SCHEMA_VERSION,
): Promise<number> => {
  const stored = await adapter.get<number>(StorageKeys.schemaVersion);

  if (stored !== null && stored > target) {
    throw new Error(
      `Stored data is at schema version ${stored}, but this app understands version ${target}. ` +
        'It was written by a newer version of the app.',
    );
  }

  let version = stored ?? 1;
  if (stored === null) {
    await adapter.set(StorageKeys.schemaVersion, version);
  }

  const pending = migrations
    .filter((m) => m.to > version && m.to <= target)
    .sort((a, b) => a.to - b.to);

  for (const migration of pending) {
    await migration.migrate(adapter);
    version = migration.to;
    await adapter.set(StorageKeys.schemaVersion, version);
  }

  if (version < target) {
    version = target;
    await adapter.set(StorageKeys.schemaVersion, version);
  }

  return version;
};
