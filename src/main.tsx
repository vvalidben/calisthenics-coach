import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { AppShell } from './app/AppShell';
import { applyTheme, storedTheme } from './features/settings/useTheme';
import './app/theme.css';

// Before the first paint, so the app never flashes paper at someone who
// chose night.
applyTheme(storedTheme());

registerSW({ immediate: true });

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </StrictMode>,
);
