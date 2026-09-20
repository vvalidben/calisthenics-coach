import { openDB, type IDBPDatabase } from 'idb';
import { snapshot, type StorageAdapter } from './adapter';

export const DB_NAME = 'calisthenics-coach';
export const STORE_NAME = 'kv';

/**
 * Browser implementation. One object store keyed by string — the shape of the
 * data is the domain layer's business, not the database's, which keeps
 * migrations in application code where they can be tested.
 */
export class IndexedDbAdapter implements StorageAdapter {
  private db: Promise<IDBPDatabase> | null = null;

  constructor(private readonly dbName: string = DB_NAME) {}

  private connect(): Promise<IDBPDatabase> {
    this.db ??= openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    return this.db;
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.connect();
    const value = await db.get(STORE_NAME, key);
    return value === undefined ? null : (value as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.connect();
    await db.put(STORE_NAME, snapshot(value), key);
  }

  async remove(key: string): Promise<void> {
    const db = await this.connect();
    await db.delete(STORE_NAME, key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const db = await this.connect();
    const keys = (await db.getAllKeys(STORE_NAME)) as string[];
    return keys.filter((k) => prefix === undefined || k.startsWith(prefix)).sort();
  }

  async clear(): Promise<void> {
    const db = await this.connect();
    await db.clear(STORE_NAME);
  }

  async close(): Promise<void> {
    if (!this.db) return;
    (await this.db).close();
    this.db = null;
  }
}
