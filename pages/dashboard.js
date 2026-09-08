import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useQuotes } from '../hooks/useQuotes';
import { Ban, Zap, Mic, FileText, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { Card, Badge, Btn, Spinner } from '../components/ui';
import { PLANS, quotesRemaining } from '../lib/stripe';

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { quotes, loading: quotesLoading } = useQuotes();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  const stats = {
    total: quotes.length,
    approved: quotes.filter(q => q.status === 'Approved').length,
    revenue: quotes.filter(q => q.status === 'Approved').reduce((s, q) => s + (q.total || 0), 0),
    pending: quotes.filter(q => q.status === 'Sent').length,
  };

  const remaining = profile ? quotesRemaining(profile) : 0;
  const plan = profile?.plan || 'free';

  return (
    <AppShell>
      <div style={{ padding: '0 0 24px' }}>
        {/* Welcome header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '24px 20px 28px' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 3px' }}>Good to see you,</p>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: '0 0 20px', fontFamily: "'Sora', sans-serif', letterSpacing: '-0.5px'" }}>
            {profile?.company_name || 'My Company'}
          </h1>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, sub: 'Approved' },
              { label: 'Pending', value: stats.pending, sub: 'Awaiting reply' },
              { label: 'Total', value: stats.total, sub: 'All quotes' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 10px' }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{s.label}</p>
                <p style={{ color: '#fff', fontSize: 19, fontWeight: 900, margin: '0 0 1px', fontFamily: "'Sora', sans-serif" }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 16px 0' }}>
          {/* Free plan quota warning */}
          {plan === 'free' && (
            <div style={{ background: remaining === 0 ? '#fef2f2' : '#fffbeb', border: `1px solid ${remaining === 0 ? '#fecaca' : '#fde68a'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              {remaining === 0 ? <Ban size={22} color="#dc2626" /> : <Zap size={22} color="#d97706" />}
              <div style={{ flex: 1 }}>
                <p style={{ color: remaining === 0 ? '#dc2626' : '#d97706', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>
                  {remaining === 0 ? 'Monthly limit reached' : `${remaining} free quote${remaining !== 1 ? 's' : ''} remaining`}
                </p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                  {remaining === 0 ? 'Upgrade to continue creating quotes' : 'Free plan · 3 quotes/month'}
                </p>
              </div>
              <Btn onClick={() => router.push('/billing')} size="sm" style={{ flexShrink: 0 }}>Upgrade</Btn>
            </div>
          )}

          {/* Main CTA */}
          <button
            onClick={() => router.push('/record')}
            style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 18, padding: '20px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 6px 24px rgba(37,99,235,0.35)', marginBottom: 12, textAlign: 'left' }}
          >
            <div style={{ width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mic size={24} color="#fff" strokeWidth={2.25} /></div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: '0 0 3px', fontFamily: "'Sora', sans-serif" }}>Record New Job</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Walk the site → AI quote in 2 min</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>›</span>
          </button>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {[
              { Icon: FileText, label: 'New Quote', href: '/quotes/new' },
              { Icon: Users, label: 'Add Client', href: '/customers' },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.href)} style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <item.Icon size={18} color="#2563eb" strokeWidth={2} />
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Recent quotes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: '#0f172a', fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Sora', sans-serif" }}>Recent Quotes</h2>
            <button onClick={() => router.push('/quotes')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View all</button>
          </div>

          {quotesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
          ) : quotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', background: '#f8fafc', borderRadius: 16, border: '1px dashed #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 10px' }}><FileText size={32} color="#cbd5e1" /></div>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>No quotes yet. Record your first job!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quotes.slice(0, 5).map(q => (
                <Card key={q.id} onClick={() => router.push(`/quotes/${q.id}`)} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.customer_name || 'No customer'}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.address || 'No address'} · {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge status={q.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>#{q.number}</span>
                    <span style={{ color: '#0f172a', fontSize: 15, fontWeight: 900 }}>${(q.total || 0).toLocaleString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
