import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { Mic, Sparkles, FileText, Link2, Mail } from 'lucide-react';
import { JobSnapLogo, Btn } from '../components/ui';


// Small rotating typewriter effect for the hero headline: types a phrase,
// pauses, deletes it, then moves to the next one -- purely visual, no deps.
const HERO_PHRASES = ['seconds', 'one voice memo', 'zero paperwork'];
function useTypewriter(phrases, { typeSpeed = 55, deleteSpeed = 28, pause = 1300 } = {}) {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[idx % phrases.length];
    let t;
    if (!deleting && text.length < current.length) {
      t = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed);
    } else if (!deleting && text.length === current.length) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text.length > 0) {
      t = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeed);
    } else {
      setDeleting(false);
      setIdx(i => (i + 1) % phrases.length);
    }
    return () => clearTimeout(t);
  }, [text, deleting, idx, phrases]);

  return text;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const typedPhrase = useTypewriter(HERO_PHRASES);

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

        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15, fontFamily: "'Sora', sans-serif", minHeight: 92 }}>
          AI quotes in<br />
          <span style={{ color: '#2563eb' }}>
            {typedPhrase}
            <span style={{ display: 'inline-block', width: 3, height: 30, background: '#2563eb', marginLeft: 3, verticalAlign: '-4px', animation: 'jsnapBlink 0.9s step-end infinite' }} />
          </span>
        </h1>
        <style jsx>{`
          @keyframes jsnapBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
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

    </div>
  );
}