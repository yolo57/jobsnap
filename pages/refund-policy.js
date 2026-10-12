import Link from 'next/link';
import { JobSnapLogo } from '../components/ui';

const LAST_UPDATED = 'October 11, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: "'Sora', sans-serif" }}>{title}</h2>
    <div style={{ color: '#475569', fontSize: 15, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function RefundPolicy() {
  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ marginBottom: 24 }}>
            <JobSnapLogo size={36} />
          </div>
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" }}>
          Refund Policy
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 36px' }}>Last updated: {LAST_UPDATED}</p>

        <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          This Refund Policy applies to paid JobSnap subscriptions (Pro and Premium plans). It's part of our{' '}
          <Link href="/terms" style={{ color: '#2563eb' }}>Terms of Service</Link>.
        </p>

        <Section title="1. Monthly Subscriptions">
          <p style={{ margin: 0 }}>
            JobSnap's Pro and Premium plans are billed monthly in advance. Because you get full access to the
            plan's features for the billing period you've paid for, payments are generally non-refundable once a
            billing period has started.
          </p>
        </Section>

        <Section title="2. Cancelling Your Subscription">
          <p style={{ margin: 0 }}>
            You can cancel anytime from your account settings. Cancelling stops future renewals — you'll keep
            access to your paid plan through the end of the billing period you've already paid for, and you won't
            be charged again after that.
          </p>
        </Section>

        <Section title="3. When We Do Offer a Refund">
          <p style={{ margin: '0 0 10px' }}>We'll issue a refund if:</p>
          <p style={{ margin: '0 0 6px' }}>You were charged in error (for example, a duplicate or failed-cancellation charge).</p>
          <p style={{ margin: '0 0 6px' }}>A technical issue on our end prevented you from using the service for a meaningful part of the billing period, and you let us know within 14 days.</p>
          <p style={{ margin: 0 }}>You were charged after a cancellation request that we failed to process in time.</p>
        </Section>

        <Section title="4. How to Request a Refund">
          <p style={{ margin: 0 }}>
            Email us at{' '}
            <a href="mailto:support@jobsnap-psi.vercel.app" style={{ color: '#2563eb' }}>support@jobsnap-psi.vercel.app</a>{' '}
            with your account email and the reason for your request. We aim to respond within 2 business days and,
            where a refund is approved, to process it back to your original payment method within 5–10 business
            days.
          </p>
        </Section>

        <Section title="5. Free Plan">
          <p style={{ margin: 0 }}>
            The Free plan has no charge, so this policy doesn't apply to it.
          </p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
          <Link href="/" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to JobSnap
          </Link>
        </div>
      </div>
    </div>
  );
}
