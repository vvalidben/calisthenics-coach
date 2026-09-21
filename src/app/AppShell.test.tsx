import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MemoryAdapter } from '../storage/memory-adapter';
import { StorageKeys } from '../storage/adapter';
import { AppShell } from './AppShell';

const renderApp = (adapter = new MemoryAdapter()) =>
  render(
    <MemoryRouter>
      <AppShell adapter={adapter} today="2026-09-20" />
    </MemoryRouter>,
  );

describe('AppShell', () => {
  it('lands on Today once the store is ready', async () => {
    // 2026-09-20 is a Sunday, which the programme leaves as a rest day.
    renderApp();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/rest day/i);
  });

  it('shows the prescribed session on a training day', async () => {
    render(
      <MemoryRouter>
        <AppShell adapter={new MemoryAdapter()} today="2026-09-21" />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Push and Core');
  });

  it('shows both tabs', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^progress$/i })).toBeInTheDocument();
  });

  it('switches to the progress tab', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1 });

    await userEvent.click(screen.getByRole('link', { name: /^progress$/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /progress/i })).toBeInTheDocument();
  });

  it('reaches an exercise from the pathway map', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(screen.getByRole('link', { name: /^progress$/i }));
    await userEvent.click(await screen.findByRole('link', { name: 'Tempo Push-Up' }));

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Tempo Push-Up');
  });

  it('seeds the store on first run', async () => {
    const adapter = new MemoryAdapter();
    renderApp(adapter);
    await screen.findByRole('heading', { level: 1 });

    await waitFor(async () => {
      await expect(adapter.get(StorageKeys.profile)).resolves.not.toBeNull();
    });
  });

  it('explains itself instead of rendering blank when the store cannot be read', async () => {
    const adapter = new MemoryAdapter();
    await adapter.set(StorageKeys.schemaVersion, 99);

    renderApp(adapter);

    expect(await screen.findByRole('alert')).toHaveTextContent(/newer version/i);
  });
});
