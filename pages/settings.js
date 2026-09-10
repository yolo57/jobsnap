import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Check, Star } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { Card, Input, Btn, PageHeader, Badge, Spinner } from '../components/ui';
import { PLANS } from '../lib/stripe';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, refreshProfile, getToken } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgradingTo, setUpgradingTo] = useState(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (profile) setForm({ ...profile });
    if (router.query.upgraded) {
      refreshProfile();
      router.replace('/settings');
    }
  }, [user, profile]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Please choose an image under 3MB.'); return; }
    setUploadingLogo(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-logo', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      set('logo_url', data.url);
    } catch (err) {
      alert('Logo upload failed: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase.from('profiles').update({
      company_name: form.company_name,
      owner_name: form.owner_name,
      phone: form.phone,
      email: form.email,
      license_number: form.license_number,
      logo_url: form.logo_url,
      tax_rate: form.tax_rate,
      payment_terms: form.payment_terms,
      quote_notes: form.quote_notes,
      followups_enabled: form.followups_enabled,
    }).eq('id', user.id);
    setSaving(false);
    if (error) {
      alert('Save failed: ' + error.message);
      return;
    }
    if (!data || (Array.isArray(data) && data.length === 0)) {
      alert('Save did not go through — please try again or contact support.');
      return;
    }
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleUpgrade = async (plan) => {
    setUpgradingTo(plan);
    const token = await getToken();
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const { url, error } = await res.json();
    if (error) { alert(error); setUpgradingTo(null); return; }
    window.location.href = url;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (!user || !form) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  const plan = profile?.plan || 'free';
  const planInfo = PLANS[plan];

  return (
    <AppShell>
      <PageHeader title="Settings" action={
        <button onClick={handleSave} style={{ background: saved ? '#f0fdf4' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: saved ? '1px solid #bbf7d0' : 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: saved ? '#16a34a' : '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {saved && <Check size={14} strokeWidth={3} />}{saved ? 'Saved' : 'Save'}
        </button>
      } />

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {/* Plan badge */}
        <Card style={{ marginBottom: 20, padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Current Plan</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#0f172a', fontSize: 18, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>{planInfo?.name}</span>
                <Badge status={plan} />
              </div>
            </div>
            <span style={{ color: '#0f172a', fontSize: 20, fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>
              {plan === 'free' ? 'Free' : `$${planInfo?.price}/mo`}
            </span>
          </div>
          {plan === 'free' && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                {profile?.quotes_used_this_month || 0} / 3 quotes used this month
              </p>
            </div>
          )}
          {plan === 'free' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn onClick={() => handleUpgrade('pro')} fullWidth loading={upgradingTo === 'pro'}>Upgrade to Pro — $79/mo</Btn>
              <Btn onClick={() => handleUpgrade('premium')} fullWidth variant="secondary" loading={upgradingTo === 'premium'}>Premium — $129/mo (+ Follow-ups)</Btn>
            </div>
          )}
          {plan === 'pro' && (
            <Btn onClick={() => handleUpgrade('premium')} fullWidth variant="secondary" loading={upgradingTo === 'premium'}>Upgrade to Premium — $129/mo</Btn>
          )}
        </Card>

        {/* Billing plans comparison */}
        {plan === 'free' && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Compare Plans</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { plan: 'pro', highlight: true },
                { plan: 'premium', highlight: false },
              ].map(({ plan: p, highlight }) => (
                <Card key={p} style={{ border: highlight ? '2px solid #2563eb' : '1px solid #e2e8f0', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Sora', sans-serif", color: '#0f172a' }}>{PLANS[p].name}</span>
                    <span style={{ color: highlight ? '#2563eb' : '#0f172a', fontWeight: 900, fontSize: 18 }}>${PLANS[p].price}<span style={{ fontSize: 12, fontWeight: 500 }}>/mo</span></span>
                  </div>
                  {PLANS[p].features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                      <Check size={15} color="#2563eb" strokeWidth={3} />
                      <span style={{ color: '#475569', fontSize: 13 }}>{f}</span>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Company branding */}
        <SectionHeader title="Company Branding" sub="Appears on all quotes and PDFs" />
        <Card style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {form.logo_url && <img src={form.logo_url} alt="Logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }} />}
              <label style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '9px 14px', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: uploadingLogo ? 'default' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: uploadingLogo ? 0.6 : 1 }}>
                {uploadingLogo ? 'Uploading...' : form.logo_url ? 'Change logo' : 'Upload logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} style={{ display: 'none' }} />
              </label>
              {form.logo_url && (
                <button onClick={() => set('logo_url', '')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
              )}
            </div>
          </div>
          <Input label="Company Name" value={form.company_name || ''} onChange={v => set('company_name', v)} placeholder="Jake's Contracting" />
          <Input label="Your Name" value={form.owner_name || ''} onChange={v => set('owner_name', v)} placeholder="Jake Smith" />
          <Input label="Phone" value={form.phone || ''} onChange={v => set('phone', v)} placeholder="555-0000" type="tel" />
          <Input label="Email" value={form.email || ''} onChange={v => set('email', v)} placeholder="you@company.com" type="email" />
          <Input label="License Number" value={form.license_number || ''} onChange={v => set('license_number', v)} placeholder="CA-12345" style={{ marginBottom: 0 }} />
        </Card>

        {/* Quote defaults */}
        <SectionHeader title="Quote Defaults" />
        <Card style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax Rate (%)</p>
              <button onClick={() => set('tax_rate', 8.25)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '3px 10px', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Use Texas rate (8.25%)</button>
            </div>
            <input type="number" value={form.tax_rate || 0} onChange={e => set('tax_rate', e.target.value)} min="0" max="30" step="0.1" style={{ width: '100%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            <p style={{ color: '#94a3b8', fontSize: 11, margin: '6px 0 0' }}>Applied automatically to new estimates. You can override it per-quote at save time.</p>
          </div>
          <Input label="Payment Terms" value={form.payment_terms || ''} onChange={v => set('payment_terms', v)} placeholder="Due upon completion" />
          <Input label="Default Quote Notes" value={form.quote_notes || ''} onChange={v => set('quote_notes', v)} placeholder="Thank you for your business!" multiline style={{ marginBottom: 0 }} />
        </Card>

        {/* Follow-ups toggle (Premium only) */}
        <SectionHeader title="Auto Follow-Ups" sub="Premium feature" />
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>Email Follow-Ups</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                {plan !== 'premium' && <Star size={12} strokeWidth={2.25} />}{plan === 'premium' ? 'Automatically remind customers at 24h, 3 days, 7 days' : 'Available on Premium plan only'}
              </p>
            </div>
            <button
              onClick={() => plan === 'premium' && set('followups_enabled', !form.followups_enabled)}
              style={{ width: 48, height: 28, borderRadius: 14, background: form.followups_enabled && plan === 'premium' ? '#2563eb' : '#e2e8f0', border: 'none', cursor: plan === 'premium' ? 'pointer' : 'default', position: 'relative', transition: 'background 0.2s', opacity: plan !== 'premium' ? 0.5 : 1 }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', position: 'absolute', top: 3, left: form.followups_enabled && plan === 'premium' ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {plan !== 'premium' && (
            <Btn onClick={() => handleUpgrade('premium')} fullWidth variant="secondary" size="sm" loading={upgradingTo === 'premium'}>
              Upgrade to Premium to enable
            </Btn>
          )}
        </Card>

        <Btn onClick={handleSave} fullWidth size="lg" loading={saving} style={{ marginBottom: 12 }}>
          {saved && <Check size={16} strokeWidth={3} />}{saved ? 'Saved!' : 'Save Settings'}
        </Btn>
        <Btn onClick={handleSignOut} fullWidth variant="ghost">Sign Out</Btn>

        <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 11, marginTop: 24 }}>
          JobSnap v2.0 · {user?.email}
        </p>
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{title}</p>
      {sub && <p style={{ color: '#cbd5e1', fontSize: 11, margin: 0 }}>{sub}</p>}
    </div>
  );
}
