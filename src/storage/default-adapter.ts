import type { StorageAdapter } from './adapter';
import { IndexedDbAdapter } from './indexeddb-adapter';

let instance: StorageAdapter | null = null;

/**
 * The application's single store.
 *
 * Shared rather than constructed per caller: React StrictMode runs effects
 * twice in development, and two adapters would open two IndexedDB connections
 * that race each other to seed the same empty store.
 */
export const defaultAdapter = (): StorageAdapter => (instance ??= new IndexedDbAdapter());
