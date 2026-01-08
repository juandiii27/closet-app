import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { validateEnvironment } from './utils/envCheck';
import { ErrorBoundary } from './components/ErrorBoundary';

// Check env on startup
validateEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
