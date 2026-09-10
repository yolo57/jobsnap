import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuotes } from '../hooks/useQuotes';
import AppShell from '../components/layout/AppShell';
import { Card, PageHeader, EmptyState, Spinner } from '../components/ui';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';

export default function SchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { quotes, loading } = useQuotes();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);

  if (!user) return null;

  const scheduled = (quotes || [])
    .filter(q => q.scheduled_date)
    .sort((a, b) => (a.scheduled_date + (a.scheduled_time || '')).localeCompare(b.scheduled_date + (b.scheduled_time || '')));

  const groups = [];
  for (const q of scheduled) {
    const key = q.scheduled_date;
    let group = groups.find(g => g.date === key);
    if (!group) { group = { date: key, items: [] }; groups.push(group); }
    group.items.push(q);
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d - today) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <AppShell>
      <PageHeader title="Schedule" subtitle={`${scheduled.length} upcoming job${scheduled.length === 1 ? '' : 's'}`} />

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} />}
            title="No jobs scheduled"
            sub="Schedule a job from an approved quote and it will show up here."
          />
        ) : (
          groups.map(group => (
            <div key={group.date} style={{ marginBottom: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                {formatDate(group.date)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.items.map(q => (
                  <Card key={q.id} onClick={() => router.push(`/quotes/${q.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <p style={{ color: '#0f172a', fontSize: 15, fontWeight: 800, margin: 0 }}>{q.customer_name || 'No customer'}</p>
                          {q.scheduled_time && <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{q.scheduled_time}</span>}
                        </div>
                        {q.address && (
                          <p style={{ color: '#64748b', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={12} style={{ flexShrink: 0 }} /> {q.address}
                          </p>
                        )}
                      </div>
                      <p style={{ color: '#2563eb', fontSize: 15, fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>${(q.total || 0).toLocaleString()}</p>
                      <ChevronRight size={16} color="#cbd5e1" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
