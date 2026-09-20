import type { z } from 'zod';
import { userProfileSchema, type UserProfile } from '../domain/profile';
import { progressionStateSchema, type ProgressionState } from '../domain/progression';
import { workoutSessionSchema, type WorkoutSession } from '../domain/session';
import { workoutSchema, type Workout } from '../domain/workout';
import { StorageKeys, StoragePrefixes, type StorageAdapter } from './adapter';

/**
 * Repositories are the only thing that reads or writes domain objects. They
 * validate on the way in *and* on the way out: corrupt stored data fails loudly
 * here rather than surfacing as a confusing render error three layers up.
 */

export class StoredDataError extends Error {
  constructor(what: string, cause: unknown) {
    super(`Stored ${what} does not match the current schema.`);
    this.name = 'StoredDataError';
    this.cause = cause;
  }
}

const parseStored = <T>(schema: z.ZodType<T>, what: string, raw: unknown): T => {
  const result = schema.safeParse(raw);
  if (!result.success) throw new StoredDataError(what, result.error);
  return result.data;
};

export interface SingletonRepository<T> {
  load(): Promise<T | null>;
  save(value: T): Promise<T>;
  clear(): Promise<void>;
}

export interface CollectionRepository<T> {
  get(id: string): Promise<T | null>;
  save(value: T): Promise<T>;
  list(): Promise<T[]>;
  remove(id: string): Promise<void>;
}

const singletonRepository = <T>(
  adapter: StorageAdapter,
  key: string,
  schema: z.ZodType<T>,
  what: string,
): SingletonRepository<T> => ({
  async load() {
    const raw = await adapter.get(key);
    return raw === null ? null : parseStored(schema, what, raw);
  },
  async save(value) {
    const parsed = schema.parse(value);
    await adapter.set(key, parsed);
    return parsed;
  },
  async clear() {
    await adapter.remove(key);
  },
});

const collectionRepository = <T>(
  adapter: StorageAdapter,
  prefix: string,
  schema: z.ZodType<T>,
  what: string,
  idOf: (value: T) => string,
  sort?: (a: T, b: T) => number,
): CollectionRepository<T> => ({
  async get(id) {
    const raw = await adapter.get(`${prefix}${id}`);
    return raw === null ? null : parseStored(schema, what, raw);
  },
  async save(value) {
    const parsed = schema.parse(value);
    await adapter.set(`${prefix}${idOf(parsed)}`, parsed);
    return parsed;
  },
  async list() {
    const keys = await adapter.keys(prefix);
    const raws = await Promise.all(keys.map((k) => adapter.get(k)));
    const items = raws.map((raw) => parseStored(schema, what, raw));
    return sort ? items.sort(sort) : items;
  },
  async remove(id) {
    await adapter.remove(`${prefix}${id}`);
  },
});

export interface Repositories {
  profile: SingletonRepository<UserProfile>;
  workouts: CollectionRepository<Workout>;
  sessions: CollectionRepository<WorkoutSession>;
  progression: CollectionRepository<ProgressionState>;
}

export const createRepositories = (adapter: StorageAdapter): Repositories => ({
  profile: singletonRepository(adapter, StorageKeys.profile, userProfileSchema, 'profile'),

  workouts: collectionRepository(
    adapter,
    StoragePrefixes.workout,
    workoutSchema,
    'workout',
    (w) => w.id,
  ),

  sessions: collectionRepository(
    adapter,
    StoragePrefixes.session,
    workoutSessionSchema,
    'session',
    (s) => s.id,
    (a, b) => a.date.localeCompare(b.date),
  ),

  progression: collectionRepository(
    adapter,
    StoragePrefixes.progression,
    progressionStateSchema,
    'progression state',
    (p) => p.family,
  ),
});
