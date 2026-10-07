import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// CSS Modules used by the viewer/editor are bundled automatically by Vite.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
