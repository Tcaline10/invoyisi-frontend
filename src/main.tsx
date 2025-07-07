import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Simple environment check for debugging
console.log('Environment check in main.tsx:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'Using fallback URL');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (not shown for security)' : 'Using fallback key');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);