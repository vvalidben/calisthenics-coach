import { StorageKeys, type StorageAdapter } from './adapter';

/**
 * Bump this whenever a stored shape changes, and add the matching migration
 * below. Version 1 is the baseline introduced in Sprint 1.
 */
export const CURRENT_SCHEMA_VERSION = 1;

export interface Migration {
  /** The schema version this migration produces. */
  to: number;
  migrate: (adapter: StorageAdapter) => Promise<void>;
}

/**
 * Migrations for the real store. Empty at version 1 — the runner exists now so
 * that later sprints can evolve stored data without discarding training
 * history.
 */
export const MIGRATIONS: Migration[] = [];

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
