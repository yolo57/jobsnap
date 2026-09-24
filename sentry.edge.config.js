// Sentry edge runtime error tracking (middleware, edge API routes).
// Set SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN) in Vercel to activate.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
});
