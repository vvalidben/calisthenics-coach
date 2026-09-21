import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** The document the browser gets before any JavaScript runs. */
const HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

/** The noscript fallback is allowed to block: nothing else can run there. */
const SCRIPTED = HTML.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');

const links = () => [...SCRIPTED.matchAll(/<link\b[^>]*>/gs)].map(([tag]) => tag);

describe('the first paint', () => {
  it('scales to the device rather than to a desktop window', () => {
    expect(HTML).toMatch(/name="viewport"[^>]*width=device-width/);
  });

  it('allows the athlete to zoom', () => {
    expect(HTML).not.toMatch(/user-scalable=no|maximum-scale=1/);
  });

  it('reaches into the safe area on a notched phone', () => {
    expect(HTML).toMatch(/viewport-fit=cover/);
  });

  it('is not held up by a stylesheet on someone else’s server', () => {
    const blocking = links().filter(
      (tag) => /rel="stylesheet"/.test(tag) && /https?:\/\//.test(tag),
    );
    expect(blocking).toEqual([]);
  });

  it('still asks for the font, just without waiting for it', () => {
    expect(HTML).toMatch(/rel="preload"[^>]*as="style"|as="style"[^>]*rel="preload"/s);
    expect(HTML).toMatch(/<noscript>[\s\S]*fonts\.googleapis[\s\S]*<\/noscript>/);
  });

  it('declares its language, so a screen reader knows how to say it', () => {
    expect(HTML).toMatch(/<html lang="en">/);
  });

  it('colours the browser chrome to match the app', () => {
    expect(HTML).toMatch(/name="theme-color" content="#151b23"/);
  });
});
