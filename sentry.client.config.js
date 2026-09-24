// Sentry client-side error tracking.
// Set NEXT_PUBLIC_SENTRY_DSN in Vercel to activate — until then this is a harmless no-op.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
