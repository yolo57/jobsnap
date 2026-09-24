import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { initPostHog, trackPageview, identifyUser } from '../lib/posthog';
import '../styles/globals.css';

// Sends a pageview (tagged with native app / installed PWA / browser) on every
// route change, and identifies the PostHog user once we know who's signed in.
// No-ops entirely until NEXT_PUBLIC_POSTHOG_KEY is set.
function Analytics() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    initPostHog();
    trackPageview(window.location.href);
    const handleRouteChange = (url) => trackPageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.id) identifyUser(user.id, { email: user.email });
  }, [user]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Analytics />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
