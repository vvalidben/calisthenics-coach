import { describe, expect, it } from 'vitest';
import { defaultAdapter } from './default-adapter';

describe('defaultAdapter', () => {
  it('hands out one shared store rather than a new connection per caller', () => {
    // React StrictMode runs effects twice; two adapters would mean two
    // IndexedDB connections racing to seed the same empty store.
    expect(defaultAdapter()).toBe(defaultAdapter());
  });

  it('round-trips through the shared store', async () => {
    await defaultAdapter().set('meta:probe', 'ok');
    await expect(defaultAdapter().get('meta:probe')).resolves.toBe('ok');
    await defaultAdapter().remove('meta:probe');
  });
});
