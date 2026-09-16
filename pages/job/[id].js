import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { HardHat, MapPin } from 'lucide-react';
import Timeline from '../../components/Timeline';
import { getT } from '../../lib/i18n';

export default function JobUpdatePage() {
  const router = useRouter();
  const { id, t: token } = router.query;
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const lang = info?.language || 'en';
  const t = getT(lang);

  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        const res = await fetch(`/api/quotes/${id}/job-info?t=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) { setError(data.error || t('link_not_valid')); return; }
        setInfo(data);
      } catch (e) {
        setError(t('could_not_load_job'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`jobsnap_crew_name_${id}`) : null;
    if (saved) { setName(saved); setNameSaved(true); }
  }, [id]);

  const saveName = () => {
    if (!name.trim()) return;
    try { localStorage.setItem(`jobsnap_crew_name_${id}`, name.trim()); } catch (e) {}
    setNameSaved(true);
  };

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <p style={{ color: '#dc2626', fontSize: 15 }}>{error}</p>
      </div>
    );
  }

  if (!info) {
    return <div style={{ minHeight: '100dvh' }} />;
  }

  return (
    <>
      <Head>
        <title>{t('job_updates')} — {info.companyName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: '100dvh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '24px 20px 28px' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <HardHat size={13} /> {t('crew_job_updates')}
            </p>
            <h1 style={{ color: '#fff', fontSize: 21, fontWeight: 900, margin: '0 0 4px', fontFamily: "'Sora', sans-serif" }}>{info.customerName || 'Job'}</h1>
            {info.address && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={12} /> {info.address}
              </p>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px' }}>
          {!nameSaved ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{t('your_name')}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t('your_name_placeholder')} style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: 14 }} />
                <button onClick={saveName} disabled={!name.trim()} style={{ background: !name.trim() ? '#cbd5e1' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: !name.trim() ? 'default' : 'pointer' }}>{t('continue_label')}</button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: '8px 0 0' }}>{t('crew_name_hint', info.companyName)}</p>
            </div>
          ) : (
            <Timeline quoteId={id} role="sub" subToken={token} authorName={name} canLogUpdates lang={lang} />
          )}

          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 11, marginTop: 24 }}>{t('powered_by')}</p>
        </div>
      </div>
    </>
  );
}
