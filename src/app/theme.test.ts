import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The stylesheet, read as text.
 *
 * Tests run with `css: false`, so nothing here is a computed style — jsdom has
 * no layout engine and would report zeroes either way. This asserts the
 * *contract* the stylesheet promises: tap targets big enough for a thumb, a
 * layout that answers to a wide screen, motion that can be turned off. It
 * cannot prove a button looks right, and does not claim to.
 */
const CSS = readFileSync(resolve(process.cwd(), 'src/app/theme.css'), 'utf8');

/** Comments can hold braces and colons, so they go before anything is parsed. */
const SOURCE = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Every rule in the sheet, innermost only: a selector cannot contain a brace,
 * so backtracking walks past `@media (...) {` and lands on the rule inside it.
 *
 * A fresh expression each call — a shared one with the global flag carries its
 * own position between callers.
 */
const rules = () => [...SOURCE.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

/** Every declaration that applies to a selector, in source order. */
const declarationsFor = (selector: string): Record<string, string> => {
  const merged: Record<string, string> = {};

  for (const [, selectors, body] of rules()) {
    const applies = (selectors ?? '')
      .split(',')
      .map((s) => s.trim())
      .includes(selector);
    if (!applies) continue;

    for (const declaration of (body ?? '').split(';')) {
      const [property, ...rest] = declaration.split(':');
      if (property && rest.length > 0) merged[property.trim()] = rest.join(':').trim();
    }
  }

  return merged;
};

const pixels = (value: string | undefined): number => Number(/(-?[\d.]+)px/.exec(value ?? '')?.[1] ?? NaN);

/** Everything the thumb has to hit. */
const TAP_TARGETS = [
  '.detail__how',
  '.button',
  '.button--quiet',
  '.tabbar__link',
  '.days__day',
  '.switch',
  '.field__input',
  '.brief__summary',
  '.day__link',
  '.difficulty',
];

describe('tap targets', () => {
  it.each(TAP_TARGETS)('%s is at least 44px tall', (selector) => {
    const height = pixels(declarationsFor(selector)['min-height']);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it('gives the primary action more room than the rest', () => {
    const primary = pixels(declarationsFor('.button--primary')['min-height']);
    const quiet = pixels(declarationsFor('.button--quiet')['min-height']);
    expect(primary).toBeGreaterThan(quiet);
  });
});

describe('type', () => {
  it('keeps body text at a size phones will not zoom away from', () => {
    expect(declarationsFor('body')['font-size']).toBe('var(--step-0)');
    // Lora sets larger per em than the old sans, so 0.9375rem reads as 16px
    // would in it. Anything below 0.9 starts costing legibility.
    const base = Number(/--step-0:\s*([\d.]+)rem/.exec(SOURCE)?.[1] ?? 0);
    expect(base).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps the smallest step readable', () => {
    const smallest = Number(/--step--1:\s*([\d.]+)rem/.exec(CSS)?.[1] ?? 0);
    expect(smallest).toBeGreaterThanOrEqual(0.8125);
  });

  it('sizes the instructions for reading at arm’s length', () => {
    expect(declarationsFor('.brief__steps')['font-size']).toBe('var(--step-1)');
    expect(declarationsFor('.detail__steps li')['font-size']).toBe('var(--step-1)');
  });

  it('holds text to a readable measure rather than the window width', () => {
    expect(declarationsFor('.shell__main')['max-width']).toBe('var(--measure)');
  });
});

describe('a narrow phone', () => {
  it('sets no fixed width that would overflow a 320px screen', () => {
    const wide = rules()
      .filter(([, selectors]) => !/@media/.test(selectors ?? ''))
      .flatMap(([, selectors, body]) =>
        [...(body ?? '').matchAll(/(?:^|;)\s*width:\s*(\d+)px/g)]
          .filter((m) => Number(m[1]) > 320)
          .map(() => (selectors ?? '').trim()),
      );

    // Nothing in the sheet is pinned wider than the narrowest phone. The only
    // fixed width of any size is the desktop sidebar, at 216px.
    expect(wide).toEqual([]);
  });

  it('leaves a gutter on both sides', () => {
    expect(declarationsFor('.shell__main')['padding']).toMatch(/var\(--gutter\)/);
  });
});

describe('a wide screen', () => {
  it('has a layout of its own', () => {
    expect(CSS).toMatch(/@media \(min-width: \d+px\)/);
  });

  it('moves the navigation off the bottom edge, where a mouse never goes', () => {
    const desktop = CSS.slice(CSS.indexOf('@media (min-width:'));
    expect(desktop).toMatch(/\.tabbar\s*\{[^}]*position:\s*sticky/);
  });

  it('keeps the content column in the middle', () => {
    expect(declarationsFor('.shell__main')['margin-inline']).toBe('auto');
  });
});

describe('getting around by keyboard', () => {
  it('shows where the focus is', () => {
    expect(declarationsFor(':focus-visible')['outline']).toMatch(/solid/);
  });

  it('hides the skip link until it is focused', () => {
    expect(declarationsFor('.skip')['position']).toBe('absolute');
    expect(declarationsFor('.skip:focus')['transform']).toBeDefined();
  });

  it('only ever removes an outline from the one element that is not tab-reachable', () => {
    const removals = rules()
      .filter(([, , body]) => /outline:\s*(none|0)\b/.test(body ?? ''))
      .map(([, selectors]) => (selectors ?? '').trim());

    // `main` is focused programmatically after a navigation and cannot be
    // tabbed to, so no keyboard user can arrive there and lose their place.
    expect(removals).toEqual(['.shell__main:focus']);
  });
});

/** WCAG relative luminance, so the palette can be checked rather than eyeballed. */
const luminance = (hex: string): number => {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

const contrast = (a: string, b: string): number => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
};

/** The dark-mode overrides, which redefine the same token names. */
const DARK = SOURCE.slice(SOURCE.indexOf(":root[data-theme='dark']"));

const token = (name: string, scope: string = SOURCE): string => {
  const value = new RegExp(String.raw`--${name}:\s*(#[0-9a-f]{6})`).exec(scope)?.[1];
  if (value === undefined) throw new Error(`no token --${name}`);
  return value;
};

describe('contrast', () => {
  /*
   * The inks that carry words, in both modes.
   *
   * --color-accent (3.0:1 on paper) and --color-neutral-600 (3.9:1) are
   * deliberately absent: the design sets them as strokes, ticks and fills,
   * and anything carrying text uses the step below. `--ink-*` names that
   * split, so a future edit cannot quietly put small print back on them.
   */
  const inks = ['color-text', 'color-neutral-700', 'color-accent-700', 'color-accent-800'];
  const surfaces = ['color-bg', 'color-surface'];

  it.each(inks)('%s is readable on every surface, on paper', (ink) => {
    for (const surface of surfaces) {
      expect(contrast(token(ink), token(surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(inks)('%s is readable on every surface, at night', (ink) => {
    for (const surface of surfaces) {
      expect(contrast(token(ink, DARK), token(surface, DARK))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the quiet ink off the step that fails, in both modes', () => {
    // --ink-soft carries the sub-headings and the small print.
    expect(SOURCE).toMatch(/--ink-soft: var\(--color-neutral-700\)/);
    expect(DARK).toMatch(/--ink-soft: var\(--color-neutral-700\)/);
  });

  it('never points a text role at the stroke accent', () => {
    expect(SOURCE).not.toMatch(/--ink[a-z-]*: var\(--color-accent\)\s*;/);
  });
});

describe('motion', () => {
  it('only animates when the athlete has not asked it not to', () => {
    expect(CSS).toMatch(/@media \(prefers-reduced-motion: no-preference\)/);
  });

  it('puts every animation inside that guard', () => {
    const guarded = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: no-preference)'));
    const animations = [...CSS.matchAll(/animation:/g)].length;
    expect([...guarded.matchAll(/animation:/g)].length).toBe(animations);
  });
});
