import { afterEach, describe, expect, it } from 'vitest';
import type { StorageAdapter } from './adapter';
import { MemoryAdapter } from './memory-adapter';
import { IndexedDbAdapter } from './indexeddb-adapter';

/**
 * One contract, run against every adapter. If an implementation passes this,
 * the rest of the app cannot tell which one it is holding.
 */
const describeAdapterContract = (
  name: string,
  makeAdapter: () => StorageAdapter,
  teardown?: (adapter: StorageAdapter) => Promise<void>,
) => {
  describe(`${name} (StorageAdapter contract)`, () => {
    let adapter: StorageAdapter;
    const use = () => (adapter ??= makeAdapter());

    afterEach(async () => {
      if (adapter) {
        await adapter.clear();
        await teardown?.(adapter);
      }
      adapter = undefined as unknown as StorageAdapter;
    });

    it('returns null for a key that was never written', async () => {
      await expect(use().get('profile:current')).resolves.toBeNull();
    });

    it('round-trips a stored value', async () => {
      await use().set('profile:current', { goals: ['build-muscle'], days: 4 });
      await expect(use().get('profile:current')).resolves.toEqual({
        goals: ['build-muscle'],
        days: 4,
      });
    });

    it('overwrites an existing value', async () => {
      await use().set('meta:schemaVersion', 1);
      await use().set('meta:schemaVersion', 2);
      await expect(use().get('meta:schemaVersion')).resolves.toBe(2);
    });

    it('removes a value', async () => {
      await use().set('log:a', 'x');
      await use().remove('log:a');
      await expect(use().get('log:a')).resolves.toBeNull();
    });

    it('removing a missing key is not an error', async () => {
      await expect(use().remove('never-written')).resolves.toBeUndefined();
    });

    it('lists every key when no prefix is given', async () => {
      await use().set('log:a', 1);
      await use().set('log:b', 2);
      await use().set('meta:schemaVersion', 3);
      await expect(use().keys()).resolves.toEqual(['log:a', 'log:b', 'meta:schemaVersion']);
    });

    it('lists only matching keys when a prefix is given', async () => {
      await use().set('log:a', 1);
      await use().set('log:b', 2);
      await use().set('meta:schemaVersion', 3);
      await expect(use().keys('log:')).resolves.toEqual(['log:a', 'log:b']);
    });

    it('stores a snapshot, so mutating the caller’s object does not change it', async () => {
      const value = { sets: [1, 2, 3] };
      await use().set('session:1', value);
      value.sets.push(4);
      await expect(use().get<typeof value>('session:1')).resolves.toEqual({ sets: [1, 2, 3] });
    });

    it('returns a snapshot, so mutating the result does not change what is stored', async () => {
      await use().set('session:1', { sets: [1, 2, 3] });
      const first = await use().get<{ sets: number[] }>('session:1');
      first!.sets.push(4);
      await expect(use().get('session:1')).resolves.toEqual({ sets: [1, 2, 3] });
    });

    it('clears everything', async () => {
      await use().set('log:a', 1);
      await use().set('log:b', 2);
      await use().clear();
      await expect(use().keys()).resolves.toEqual([]);
    });
  });
};

describeAdapterContract('MemoryAdapter', () => new MemoryAdapter());

describeAdapterContract(
  'IndexedDbAdapter',
  () => new IndexedDbAdapter(`test-db-${crypto.randomUUID()}`),
  async (adapter) => {
    await (adapter as IndexedDbAdapter).close();
  },
);
