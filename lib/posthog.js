import posthog from 'posthog-js';

let initialized = false;

// Figures out how this session is actually running JobSnap:
// - "native_app": wrapped in the Capacitor Android app
// - "installed_pwa": added to home screen / launched standalone
// - "browser": plain web tab
export function detectPlatform() {
  if (typeof window === 'undefined') return 'unknown';
  if (window.Capacitor?.isNativePlatform?.()) return 'native_app';
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true; // iOS Safari home-screen flag
  return isStandalone ? 'installed_pwa' : 'browser';
}

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no-op until the key is added in Vercel

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false, // we send pageviews manually on route change, with platform attached
    persistence: 'localStorage+cookie',
  });

  posthog.register({ app_platform: detectPlatform() });
  initialized = true;
}

export function trackPageview(url) {
  if (!initialized) return;
  posthog.capture('$pageview', { $current_url: url, app_platform: detectPlatform() });
}

export function identifyUser(userId, traits = {}) {
  if (!initialized || !userId) return;
  posthog.identify(userId, traits);
}

export default posthog;
