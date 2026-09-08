import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { Mic, Sparkles, FileText, Link2, Mail } from 'lucide-react';
import { JobSnapLogo, Btn } from '../components/ui';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #eff6ff', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (user) return null;

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 28px 40px', textAlign: 'center' }}>
        <div style={{ marginBottom: 32 }}>
          <JobSnapLogo size={48} />
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15, fontFamily: "'Sora', sans-serif" }}>
          AI quotes in<br /><span style={{ color: '#2563eb' }}>under 2 minutes</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 17, margin: '0 0 40px', lineHeight: 1.6, maxWidth: 320 }}>
          Record a job site walk-through. Our AI generates a professional estimate instantly.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
          <Btn onClick={() => router.push('/signup')} fullWidth size="lg">Get Started Free</Btn>
          <Btn onClick={() => router.push('/login')} fullWidth size="lg" variant="secondary">Sign In</Btn>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 40 }}>
          {[
            { Icon: Mic, label: 'Voice recording' },
            { Icon: Sparkles, label: 'GPT-4o estimates' },
            { Icon: FileText, label: 'PDF quotes' },
            { Icon: Link2, label: 'Shareable links' },
            { Icon: Mail, label: 'Auto follow-ups' },
          ].map(f => (
            <span key={f.label} style={{ background: '#f1f5f9', color: '#475569', fontSize: 13, padding: '6px 12px', borderRadius: 20, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <f.Icon size={14} strokeWidth={2.25} />{f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Pricing preview */}
      <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '32px 24px' }}>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Simple pricing</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { name: 'Free', price: '$0', sub: '3 quotes/mo' },
            { name: 'Pro', price: '$79', sub: 'Unlimited', highlight: true },
            { name: 'Premium', price: '$129', sub: '+ Follow-ups' },
          ].map(p => (
            <div key={p.name} style={{ flex: 1, background: p.highlight ? '#2563eb' : '#fff', border: `1px solid ${p.highlight ? '#2563eb' : '#e2e8f0'}`, borderRadius: 14, padding: '16px 10px', textAlign: 'center' }}>
              <p style={{ color: p.highlight ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px' }}>{p.name}</p>
              <p style={{ color: p.highlight ? '#fff' : '#0f172a', fontSize: 20, fontWeight: 900, margin: '0 0 2px', fontFamily: "'Sora', sans-serif" }}>{p.price}<span style={{ fontSize: 11, fontWeight: 500 }}>/mo</span></p>
              <p style={{ color: p.highlight ? 'rgba(255,255,255,0.7)' : '#94a3b8', fontSize: 11, margin: 0 }}>{p.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
