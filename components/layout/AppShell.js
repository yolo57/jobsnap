import { useRouter } from 'next/router';
import { LayoutGrid, FileText, Users, Settings as SettingsIcon, Mic, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { JobSnapLogo, Badge } from '../ui';
import { supabase } from '../../lib/supabase';

export default function AppShell({ children }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const path = router.pathname;

  const navLeft = [
    { href: '/dashboard', Icon: LayoutGrid, label: 'Dashboard' },
    { href: '/quotes', Icon: FileText, label: 'Quotes' },
  ];
  const navRight = [
    { href: '/schedule', Icon: Calendar, label: 'Schedule' },
    { href: '/customers', Icon: Users, label: 'Clients' },
    { href: '/settings', Icon: SettingsIcon, label: 'Settings' },
  ];

  const isActive = (href) => path === href || path.startsWith(href + '/');

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f8fafc', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: 'calc(14px + env(safe-area-inset-top)) 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 }}>
        <JobSnapLogo size={28} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {profile?.plan && profile.plan !== 'free' && <Badge status={profile.plan} />}
          <div style={{ width: 34, height: 34, borderRadius: 17, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
            onClick={() => router.push('/settings')}>
            {(profile?.company_name || user?.email || 'U')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {children}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid #e2e8f0', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', position: 'relative' }}>
          {navLeft.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 0 8px' }}
              >
                <item.Icon size={20} strokeWidth={2.25} style={{ opacity: active ? 1 : 0.45 }} color={active ? '#2563eb' : '#94a3b8'} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#2563eb' : '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          {navRight.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 0 8px' }}
              >
                <item.Icon size={20} strokeWidth={2.25} style={{ opacity: active ? 1 : 0.45 }} color={active ? '#2563eb' : '#94a3b8'} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#2563eb' : '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
          {/* FAB - Record */}
          <button
            onClick={() => router.push('/record')}
            style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', width: 54, height: 54, borderRadius: 27, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: '3px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.45)', zIndex: 10, color: '#fff' }}
          >
            <Mic size={24} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}
