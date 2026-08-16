import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/installPrompt';
import { AuthProvider } from './contexts/AuthContext';
import { UserAuthProvider } from './contexts/UserAuthContext';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UserAuthProvider>
      <App />
    </UserAuthProvider>
  </AuthProvider>
);
