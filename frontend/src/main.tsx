import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/installPrompt';
import { AuthProvider } from './contexts/AuthContext';
import { UserAuthProvider } from './contexts/UserAuthContext';

// Registering a service worker is required by Chrome/Android before it
// will offer the native "install app" prompt used by the Download the
// App button (see public/sw.js for details).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal — the app works fine without it, install prompt just
      // won't be available on Chrome/Android until this succeeds.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UserAuthProvider>
      <App />
    </UserAuthProvider>
  </AuthProvider>
);