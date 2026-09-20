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
    renderApp();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /no workout scheduled/i,
    );
  });

  it('shows both tabs', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /progressions/i })).toBeInTheDocument();
  });

  it('switches to the progressions tab', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1 });

    await userEvent.click(screen.getByRole('link', { name: /progressions/i }));

    expect(await screen.findByText(/schema version 1/i)).toBeInTheDocument();
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
