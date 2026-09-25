import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useQuotes } from '../hooks/useQuotes';
import AppShell from '../components/layout/AppShell';
import { Home, Bell, Clock } from 'lucide-react';
import { Card, PageHeader, EmptyState, Spinner } from '../components/ui';

// "Won/Lost" tabs map onto the quote statuses that already exist:
//   Pending = Sent (waiting on the customer)
//   Won     = Approved
//   Lost    = Rejected
const TABS = [
  { key: 'Pending', status: 'Sent' },
  { key: 'Won', status: 'Approved' },
  { key: 'Lost', status: 'Rejected' },
];

function timeAgo(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

export default function FollowUps() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { quotes, loading } = useQuotes();
  const [tab, setTab] = useState('Pending');

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [user, authLoading]);

  const active = TABS.find(t => t.key === tab);
  const list = quotes
    .filter(q => q.status === active.status)
    .sort((a, b) => new Date(b.sent_at || b.created_at) - new Date(a.sent_at || a.created_at));

  if (authLoading) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PageHeader title="Follow Up" onBack={() => router.push('/quotes')} />

        <div style={{ padding: '12px 16px 0', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 12 }}>
            {TABS.map(t => {
              const count = quotes.filter(q => q.status === t.status).length;
              const isActive = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, background: isActive ? '#1e3a5f' : '#fff', border: `1px solid ${isActive ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: 20, padding: '8px 10px', cursor: 'pointer', color: isActive ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  {t.key} <span style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : list.length === 0 ? (
            <EmptyState icon={<Bell size={44} strokeWidth={1.75} />} title={`No ${tab.toLowerCase()} quotes`} sub={tab === 'Pending' ? "Quotes you've sent will show up here until the customer responds." : `Quotes marked ${tab.toLowerCase()} will show up here.`} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(q => {
                const reminderSent = q.followup_sent_24h || q.followup_sent_3d || q.followup_sent_7d;
                return (
                  <Card key={q.id} onClick={() => router.push(`/quotes/${q.id}`)} style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Home size={18} color="#2563eb" strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.customer_name || 'No customer'}</p>
                        <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {timeAgo(q.status === 'Sent' ? q.sent_at : q.status === 'Approved' ? q.approved_at : q.rejected_at)}
                        </p>
                      </div>
                      {tab === 'Pending' ? (
                        <span style={{ background: reminderSent ? '#eff6ff' : '#f8fafc', color: reminderSent ? '#2563eb' : '#94a3b8', border: `1px solid ${reminderSent ? '#bfdbfe' : '#e2e8f0'}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {reminderSent ? 'Reminder Sent' : 'Waiting'}
                        </span>
                      ) : (
                        <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>${(q.total || 0).toLocaleString()}</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
