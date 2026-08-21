import { useEffect, useState } from 'react';
import HeroSection from '@/components/ui/glassmorphism-trust-hero';

const API_URL = 'http://localhost:5000';
const LOGIN_APP_URL = 'http://localhost:5174';

function App() {
  const [authStatus, setAuthStatus] = useState<
    'checking' | 'authenticated' | 'unauthenticated'
  >('checking');

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (cancelled) return;

        if (data.authenticated) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (!cancelled) {
          setAuthStatus('unauthenticated');
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      window.location.href = LOGIN_APP_URL;
    }
  }, [authStatus]);

  if (authStatus === 'checking') {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    // Redirect is already in flight (see effect above).
    // Render nothing so the hero content never flashes on screen.
    return <div className="w-full min-h-screen bg-zinc-950" />;
  }

  return (
    <div className="w-full min-h-screen bg-zinc-950">
      <HeroSection />
    </div>
  );
}

export default App;