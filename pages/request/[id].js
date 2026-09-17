import { useState } from 'react';
import Head from 'next/head';
import { CheckCircle2, Send } from 'lucide-react';
import { getT } from '../../lib/i18n';

export async function getServerSideProps({ params }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/leads/${params.id}`);
    if (!res.ok) return { notFound: true };
    const contractor = await res.json();
    return { props: { contractorId: params.id, contractor } };
  } catch (e) {
    return { notFound: true };
  }
}

export default function RequestQuotePage({ contractorId, contractor }) {
  const [lang, setLang] = useState('en');
  const t = getT(lang);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', address: '', description: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { setErr(t('name_required')); return; }
    setErr('');
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${contractorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSent(true);
      else {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || t('could_not_send_request'));
      }
    } catch (e2) {
      setErr(t('could_not_send_request'));
    } finally {
      setSending(false);
    }
  };

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 14.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', marginBottom: 14 };
  const labelStyle = { display: 'block', color: '#475569', fontSize: 12.5, fontWeight: 700, marginBottom: 6 };

  return (
    <>
      <Head>
        <title>{t('request_a_quote')} — {contractor.company_name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100dvh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '28px 24px 32px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{t('request_a_quote')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {contractor.logo_url && <img src={contractor.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', background: '#fff' }} />}
                <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.5px' }}>{contractor.company_name || 'Contractor'}</h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['en', 'es'].map(code => (
                <button key={code} onClick={() => setLang(code)} style={{ background: lang === code ? 'rgba(255,255,255,0.25)' : 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '4px 9px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
          {sent ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 12 }} />
              <p style={{ color: '#0f172a', fontSize: 17, fontWeight: 800, margin: '0 0 6px', fontFamily: "'Sora', sans-serif" }}>{t('request_sent')}</p>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{t('request_sent_sub', contractor.company_name)}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: '22px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 18px', lineHeight: 1.5 }}>{t('request_intro')}</p>

              <label style={labelStyle}>{t('your_name')}</label>
              <input style={inputStyle} value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Jane Doe" />

              <label style={labelStyle}>{t('phone')}</label>
              <input style={inputStyle} value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="555-0000" type="tel" />

              <label style={labelStyle}>{t('email')}</label>
              <input style={inputStyle} value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="you@email.com" type="email" />

              <label style={labelStyle}>{t('job_address')}</label>
              <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St" />

              <label style={labelStyle}>{t('describe_the_job')}</label>
              <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical', marginBottom: 6 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder={t('describe_the_job_placeholder')} />

              {err && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 14px' }}>{err}</p>}

              <button type="submit" disabled={sending} style={{ width: '100%', marginTop: 12, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 14, padding: '15px', cursor: sending ? 'default' : 'pointer', color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Send size={15} /> {sending ? t('sending') : t('send_request')}
              </button>
            </form>
          )}
          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 11, marginTop: 24 }}>{t('powered_by')}</p>
        </div>
      </div>
    </>
  );
}
