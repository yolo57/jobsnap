const { withSentryConfig } = require('@sentry/nextjs/config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

// Sentry source-map upload only runs when SENTRY_AUTH_TOKEN is set (e.g. in Vercel).
// Without it, this just wraps the app for error reporting with no build-time side effects.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
});
