import Link from 'next/link';
import { useRouter } from 'next/router';
import { Check } from 'lucide-react';
import { JobSnapLogo, Btn } from '../components/ui';

// Keep this in sync with lib/stripe.js PLANS — Paddle's catalog must match these prices exactly.
const PLANS = [
  {
    name: 'Free',
    price: 0,
    tagline: 'Try it out',
    features: ['3 quotes/month', 'AI estimates', 'PDF export', 'Basic branding'],
  },
  {
    name: 'Pro',
    price: 79,
    tagline: 'For active contractors',
    highlight: true,
    features: ['Unlimited quotes', 'Full branding', 'PDF export', 'Shareable links', 'Customer CRM'],
  },
  {
    name: 'Premium',
    price: 129,
    tagline: 'For growing teams',
    features: ['Everything in Pro', 'Automated follow-ups', 'Email reminders', 'Priority support'],
  },
];

export default function Pricing() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ marginBottom: 24 }}>
            <JobSnapLogo size={36} />
          </div>
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif", textAlign: 'center' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, margin: '0 0 48px', textAlign: 'center' }}>
          Start free. Upgrade when you need more quotes.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              style={{
                flex: '1 1 260px',
                maxWidth: 300,
                border: plan.highlight ? '2px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: 16,
                padding: 28,
                position: 'relative',
                background: plan.highlight ? '#f8fafc' : '#fff',
              }}
            >
              {plan.highlight && (
                <span style={{ position: 'absolute', top: -12, left: 24, background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                  MOST POPULAR
                </span>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', fontFamily: "'Sora', sans-serif" }}>{plan.name}</h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px' }}>{plan.tagline}</p>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>${plan.price}</span>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>{plan.price > 0 ? '/month' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Check size={16} color="#2563eb" strokeWidth={2.5} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ color: '#475569', fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={() => router.push('/signup')} fullWidth variant={plan.highlight ? 'primary' : 'secondary'}>
                {plan.price === 0 ? 'Get Started Free' : 'Get Started'}
              </Btn>
            </div>
          ))}
        </div>

        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
          Cancel anytime. See our <Link href="/refund-policy" style={{ color: '#2563eb' }}>Refund Policy</Link> for details.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to JobSnap
          </Link>
        </div>
      </div>
    </div>
  );
}
