import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

/**
 * jsdom has no matchMedia. Default to "motion is fine"; `setReducedMotion(true)`
 * flips it so the reduced-motion path can be tested for real rather than assumed.
 */
let reducedMotion = false;

export const setReducedMotion = (value: boolean) => {
  reducedMotion = value;
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

beforeEach(() => {
  reducedMotion = false;
});
