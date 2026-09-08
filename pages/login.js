import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { JobSnapLogo } from '../components/ui';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><JobSnapLogo size={40} showText={false} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ color: '#dc2626', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
            style={{ width: '100%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#475569', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 12, padding: '14px', cursor: 'pointer', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 24 }}>
          Don't have an account?{' '}
          <span onClick={() => router.push('/signup')} style={{ color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>Sign up free</span>
        </p>
      </div>
    </div>
  );
}
