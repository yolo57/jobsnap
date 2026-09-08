import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { Mail } from 'lucide-react';
import { JobSnapLogo } from '../components/ui';

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSignup = async () => {
    setError('');
    if (!email || !password || !company) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(email, password);
      // Update profile with company name via API
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company_name: company }),
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Mail size={48} color="#2563eb" strokeWidth={1.75} /></div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Check your email</h2>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28, maxWidth: 300, lineHeight: 1.6 }}>
        We sent a confirmation link to <strong>{email}</strong>. Click it then sign in.
      </p>
      <button onClick={() => router.push('/login')} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', color: '#0f172a', fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}>
        Go to Sign In
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><JobSnapLogo size={40} showText={false} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Start for free</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>3 free quotes/month. No credit card.</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ color: '#dc2626', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        )}

        {[
          { label: 'Company Name', value: company, set: setCompany, placeholder: "Jake's Contracting", type: 'text' },
          { label: 'Email', value: email, set: setEmail, placeholder: 'you@company.com', type: 'email' },
          { label: 'Password', value: password, set: setPassword, placeholder: 'Min. 6 characters', type: 'password' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width: '100%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        ))}

        <button onClick={handleSignup} disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', marginTop: 8 }}>
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 20 }}>
          Already have an account?{' '}
          <span onClick={() => router.push('/login')} style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>Sign in</span>
        </p>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 }}>
          By signing up, you agree to our{' '}
          <span onClick={() => router.push('/privacy')} style={{ color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
