import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useQuotes } from '../../hooks/useQuotes';
import AppShell from '../../components/layout/AppShell';
import { Search, FileText, Mic } from 'lucide-react';
import { Card, Badge, Btn, PageHeader, EmptyState, Spinner } from '../../components/ui';

export default function QuotesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { quotes, loading } = useQuotes();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [user, authLoading]);

  const filters = ['All', 'Draft', 'Sent', 'Approved', 'Rejected'];
  const filtered = quotes.filter(q => {
    const matchFilter = filter === 'All' || q.status === filter;
    const matchSearch = !search || q.customer_name?.toLowerCase().includes(search.toLowerCase()) || q.address?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (authLoading) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PageHeader title="Quotes" action={
          <Btn onClick={() => router.push('/record')} size="sm">+ Record</Btn>
        } />

        <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', borderRadius: 12, padding: '10px 14px', alignItems: 'center', marginBottom: 12, border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quotes..." style={{ flex: 1, background: 'none', border: 'none', color: '#0f172a', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>×</button>}
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {filters.map(f => {
              const count = f === 'All' ? quotes.length : quotes.filter(q => q.status === f).length;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? '#1e3a5f' : '#fff', border: `1px solid ${filter === f ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: filter === f ? '#fff' : '#64748b', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  {f} <span style={{ background: filter === f ? 'rgba(255,255,255,0.2)' : '#f1f5f9', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<FileText size={44} strokeWidth={1.75} />} title="No quotes found" sub={search ? 'Try a different search' : 'Record a job to generate your first quote'} action={<Btn onClick={() => router.push('/record')}><Mic size={16} /> Record Job</Btn>} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(q => (
                <Card key={q.id} onClick={() => router.push(`/quotes/${q.id}`)} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                      <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.customer_name || 'No customer'}</p>
                      <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.address || 'No address'}</p>
                    </div>
                    <Badge status={q.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>#{q.number}</span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
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
