import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getT } from '../lib/i18n';
import { useQuotes } from '../hooks/useQuotes';
import AppShell from '../components/layout/AppShell';
import { Card, PageHeader, EmptyState, Spinner } from '../components/ui';
import { Calendar, MapPin, ChevronRight, ChevronLeft, HardHat, List, LayoutGrid } from 'lucide-react';

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function JobRow({ q, onClick }) {
  return (
    <Card onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{ color: '#0f172a', fontSize: 15, fontWeight: 800, margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.customer_name || 'No customer'}</p>
            {q.scheduled_time && <span style={{ flexShrink: 0, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{q.scheduled_time}</span>}
          </div>
          {q.address && (
            <p style={{ color: '#64748b', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={12} style={{ flexShrink: 0 }} /> {q.address}
            </p>
          )}
          {q.assigned_to && (
            <p style={{ color: '#2563eb', fontSize: 12, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <HardHat size={12} style={{ flexShrink: 0 }} /> {q.assigned_to}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <p style={{ color: '#2563eb', fontSize: 15, fontWeight: 800, margin: 0, whiteSpace: 'nowrap' }}>${(q.total || 0).toLocaleString()}</p>
          <ChevronRight size={16} color="#cbd5e1" />
        </div>
      </div>
    </Card>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const { user, language } = useAuth();
  const t = getT(language);
  const { quotes, loading } = useQuotes();
  const [view, setView] = useState('calendar');
  const todayStr = toDateStr(new Date());
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);

  if (!user) return null;

  const scheduled = (quotes || [])
    .filter(q => q.scheduled_date)
    .sort((a, b) => (a.scheduled_date + (a.scheduled_time || '')).localeCompare(b.scheduled_date + (b.scheduled_time || '')));

  const jobsByDate = useMemo(() => {
    const map = {};
    for (const q of scheduled) {
      (map[q.scheduled_date] ||= []).push(q);
    }
    return map;
  }, [scheduled]);

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
    if (diffDays === 0) return t('today_label');
    if (diffDays === 1) return t('tomorrow_label');
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // ─── Calendar grid math ───
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
  const weekdayLabels = language === 'es'
    ? ['D', 'L', 'M', 'X', 'J', 'V', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const goMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setCursor(d);
  };

  const selectedJobs = jobsByDate[selectedDate] || [];

  return (
    <AppShell>
      <PageHeader
        title={t('schedule_page_title')}
        subtitle={t('upcoming_jobs', scheduled.length)}
        action={
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
            <button onClick={() => setView('calendar')} style={{ border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', background: view === 'calendar' ? '#fff' : 'transparent', boxShadow: view === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center' }}>
              <LayoutGrid size={15} color={view === 'calendar' ? '#2563eb' : '#94a3b8'} />
            </button>
            <button onClick={() => setView('list')} style={{ border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', background: view === 'list' ? '#fff' : 'transparent', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center' }}>
              <List size={15} color={view === 'list' ? '#2563eb' : '#94a3b8'} />
            </button>
          </div>
        }
      />

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : view === 'calendar' ? (
          <>
            <Card style={{ marginBottom: 16, padding: '14px 14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button onClick={() => goMonth(-1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronLeft size={16} color="#475569" />
                </button>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14.5, color: '#0f172a', fontFamily: "'Sora', sans-serif", textTransform: 'capitalize' }}>{monthLabel}</p>
                <button onClick={() => goMonth(1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ChevronRight size={16} color="#475569" />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {weekdayLabels.map((wd, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{wd}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayJobs = jobsByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        aspectRatio: '1',
                        border: 'none',
                        borderRadius: 10,
                        background: isSelected ? '#2563eb' : isToday ? '#eff6ff' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        padding: 0,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: isToday || isSelected ? 800 : 500, color: isSelected ? '#fff' : isToday ? '#2563eb' : '#334155' }}>{day}</span>
                      {dayJobs.length > 0 && (
                        <span style={{ width: 4, height: 4, borderRadius: 2, background: isSelected ? '#fff' : '#2563eb' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
              {formatDate(selectedDate)}
            </p>
            {selectedJobs.length === 0 ? (
              <EmptyState icon={<Calendar size={28} />} title={t('no_jobs_scheduled')} sub={t('no_jobs_this_day')} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedJobs.map(q => <JobRow key={q.id} q={q} onClick={() => router.push(`/quotes/${q.id}`)} />)}
              </div>
            )}
          </>
        ) : groups.length === 0 ? (
          <EmptyState icon={<Calendar size={32} />} title={t('no_jobs_scheduled')} sub={t('no_jobs_scheduled_sub')} />
        ) : (
          groups.map(group => (
            <div key={group.date} style={{ marginBottom: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                {formatDate(group.date)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.items.map(q => <JobRow key={q.id} q={q} onClick={() => router.push(`/quotes/${q.id}`)} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
