/**
 * The only way the rest of the application touches persistence.
 *
 * Keys are namespaced strings (`profile:current`, `session:2026-09-21`, ...).
 * Values are anything structured-cloneable. Implementations must store and
 * return snapshots, never live references, so a caller cannot mutate the store
 * by accident.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  /** All keys in insertion-independent sorted order, optionally filtered. */
  keys(prefix?: string): Promise<string[]>;
  clear(): Promise<void>;
}

/** Namespaces reserved across all sprints. Keep new keys inside one of these. */
export const StorageKeys = {
  schemaVersion: 'meta:schemaVersion',
  profile: 'profile:current',
  workout: (id: string) => `workout:${id}`,
  session: (id: string) => `session:${id}`,
  progression: (family: string) => `progression:${family}`,
} as const;

export const StoragePrefixes = {
  meta: 'meta:',
  profile: 'profile:',
  workout: 'workout:',
  session: 'session:',
  progression: 'progression:',
} as const;

/** Deep copy used by adapters to enforce the snapshot guarantee. */
export const snapshot = <T>(value: T): T => structuredClone(value);
