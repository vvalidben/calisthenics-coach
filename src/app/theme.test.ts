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
  it('never sets body text below 16px, which is where phones start zooming', () => {
    expect(declarationsFor('body')['font-size']).toBe('var(--step-0)');
    expect(CSS).toMatch(/--step-0:\s*1rem/);
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

const token = (name: string): string => {
  const value = new RegExp(String.raw`--${name}:\s*(#[0-9a-f]{6})`).exec(SOURCE)?.[1];
  if (value === undefined) throw new Error(`no token --${name}`);
  return value;
};

describe('contrast', () => {
  const surfaces = ['steel-0', 'steel-1', 'steel-2'];
  const inks = ['chalk', 'chalk-dim', 'chalk-faint', 'signal', 'done', 'missed'];

  it.each(inks)('%s is readable on every surface', (ink) => {
    for (const surface of surfaces) {
      expect(contrast(token(ink), token(surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the quietest ink readable, since it carries the small print', () => {
    // Labels, day statuses and section headings are all --chalk-faint, and all
    // of them are small. 3:1 would be large-text only.
    expect(contrast(token('chalk-faint'), token('steel-2'))).toBeGreaterThanOrEqual(4.5);
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
