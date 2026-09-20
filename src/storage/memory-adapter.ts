import { snapshot, type StorageAdapter } from './adapter';

/** In-memory implementation used by tests and by any non-browser context. */
export class MemoryAdapter implements StorageAdapter {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    if (!this.store.has(key)) return null;
    return snapshot(this.store.get(key) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, snapshot(value));
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    return [...this.store.keys()]
      .filter((k) => prefix === undefined || k.startsWith(prefix))
      .sort();
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
