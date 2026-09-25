import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Mic, Sparkles, Send, Check, TrendingUp } from 'lucide-react';
import { Btn } from '../components/ui';

// First-launch walkthrough, shown once after signing in. Sets
// jobsnap_onboarding_seen in localStorage so it never shows again -
// checked in login.js right after a successful sign-in.
//
// Slides 1-3 sell the core loop (record -> AI quote -> send). Slide 4 is
// the upgrade pitch: per the ASO research this was built from, most trial
// conversions happen right after onboarding, while the value is freshest -
// so we ask here instead of waiting for the free-quota wall to force it
// later. Always skippable.

const SLIDES = [
  {
    icon: Mic,
    title: 'Record a job walkthrough',
    body: 'Walk the site and describe the work out loud, or snap a few photos. No forms to fill in on site.',
  },
  {
    icon: Sparkles,
    title: 'AI writes the estimate',
    body: 'JobSnap turns your recording into a professional, line-item quote in under 2 minutes.',
  },
  {
    icon: Send,
    title: 'Send it, get approved',
    body: 'Customers get a branded link to review and approve the quote — no printing, no chasing paper.',
  },
];

function markOnboardingSeen() {
  try { localStorage.setItem('jobsnap_onboarding_seen', '1'); } catch (e) {}
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isPaywall = step === SLIDES.length;

  const finish = () => {
    markOnboardingSeen();
    router.replace('/dashboard');
  };

  const goUpgrade = (plan) => {
    markOnboardingSeen();
    router.replace(`/settings?upgrade=${plan}`);
  };

  return (
    <>
      <Head><title>Welcome to JobSnap</title></Head>
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Progress dots + skip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[...SLIDES, {}].map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 4, background: i === step ? '#2563eb' : '#e2e8f0', transition: 'all 0.2s' }} />
            ))}
          </div>
          {!isPaywall && (
            <button onClick={finish} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Skip
            </button>
          )}
        </div>

        {!isPaywall ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px', textAlign: 'center' }}>
            {(() => { const Icon = SLIDES[step].icon; return (
              <div style={{ width: 96, height: 96, borderRadius: 48, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 32px rgba(37,99,235,0.3)' }}>
                <Icon size={40} color="#fff" strokeWidth={1.75} />
              </div>
            ); })()}
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', fontFamily: "'Sora', sans-serif", letterSpacing: '-0.5px' }}>
              {SLIDES[step].title}
            </h1>
            <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
              {SLIDES[step].body}
            </p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 24px 8px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><TrendingUp size={40} color="#2563eb" strokeWidth={2} /></div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', fontFamily: "'Sora', sans-serif" }}>Go unlimited from day one</h1>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                The free plan covers 3 quotes/month. Upgrade now and never hit the limit.
              </p>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#1e3a5f', fontSize: 17, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Pro</span>
                <span style={{ color: '#2563eb', fontSize: 20, fontWeight: 900 }}>$79<span style={{ fontSize: 13, fontWeight: 600 }}>/mo</span></span>
              </div>
              {['Unlimited quotes', 'Full company branding', 'Shareable quote links', 'Customer CRM'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <Check size={15} color="#2563eb" strokeWidth={3} />
                  <span style={{ color: '#374151', fontSize: 13.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <Btn onClick={() => goUpgrade('pro')} fullWidth size="lg">Upgrade to Pro — $79/month</Btn>
            <Btn onClick={() => goUpgrade('premium')} fullWidth variant="ghost" size="md" style={{ marginTop: 8 }}>
              Premium ($129/mo) — adds automated follow-ups
            </Btn>
            <button onClick={finish} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16, textAlign: 'center' }}>
              Maybe later — start free
            </button>
          </div>
        )}

        {!isPaywall && (
          <div style={{ padding: '0 24px 32px' }}>
            <Btn onClick={() => setStep(s => s + 1)} fullWidth size="lg">
              {step === SLIDES.length - 1 ? 'Continue' : 'Next'}
            </Btn>
          </div>
        )}
      </div>
    </>
  );
}
