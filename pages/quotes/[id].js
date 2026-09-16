import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { getT } from '../../lib/i18n';
import { useQuotes } from '../../hooks/useQuotes';
import AppShell from '../../components/layout/AppShell';
import { Send, Pencil, CheckCircle2, XCircle, FileText, Copy as CopyIcon, Link2, Globe, Mail, MessageSquare, Check, Star, Calendar, Flag } from 'lucide-react';
import { Card, Badge, Btn, PageHeader, Spinner, BottomSheet, Input } from '../../components/ui';
import Timeline from '../../components/Timeline';
import { HardHat } from 'lucide-react';

// navigator.clipboard.writeText() can silently reject inside the app's
// Capacitor WebView (blocked Clipboard permission, non-secure context,
// etc.) -- when that happened, the UI still said "Copied!" while nothing
// was actually on the clipboard, so whatever the user pasted afterward was
// stale/unrelated text instead of the link. Await it, and fall back to a
// classic textarea+execCommand copy, and finally to a manual prompt so the
// user can select-and-copy by hand rather than getting a false success.
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API unavailable');
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) return true;
    } catch (e2) {}
    return false;
  }
}

export default function QuoteDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, profile, getToken, language } = useAuth();
  const t = getT(language);
  const { quotes, updateQuote, deleteQuote } = useQuotes();
  const [quote, setQuote] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [copiedSub, setCopiedSub] = useState(false);
  const [gettingSubLink, setGettingSubLink] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (id && quotes.length > 0) {
      const q = quotes.find(q => q.id === id);
      if (q) {
        setQuote(q);
        setSchedDate(q.scheduled_date || '');
        setSchedTime(q.scheduled_time || '');
        setAssignedTo(q.assigned_to || '');
      }
    }
  }, [id, quotes, user]);

  useEffect(() => { setAuthToken(getToken()); }, [getToken]);

  if (!user || !quote) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  const isPro = profile?.plan === 'pro' || profile?.plan === 'premium';
  const quoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/${quote.id}`;

  const handleStatus = async (status) => {
    setUpdating(true);
    try {
      const updated = await updateQuote(quote.id, { status });
      setQuote(updated);
      return updated;
    } catch (e) {
      alert('Could not update status: ' + (e.error || e.message || 'Unknown error'));
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleFollowup = async () => {
    if (profile?.plan !== 'premium') {
      alert('Automated follow-ups are a Premium feature. Upgrade to enable.');
      return;
    }
    try {
      const updated = await updateQuote(quote.id, { followup_enabled: !quote.followup_enabled });
      setQuote(updated);
    } catch (e) {
      alert('Could not update follow-ups: ' + (e.error || e.message || 'Unknown error'));
    }
  };

  const handleDownloadPDF = async () => {
    const { downloadQuotePDF } = await import('../../lib/pdf');
    await downloadQuotePDF(quote, profile);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this quote? This cannot be undone.')) return;
    try {
      await deleteQuote(quote.id);
      router.push('/quotes');
    } catch (e) {
      alert('Could not delete quote: ' + (e.error || e.message || 'Unknown error'));
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(quoteUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      prompt('Copy this link:', quoteUrl);
    }
  };

  const handleCopySubLink = async () => {
    setGettingSubLink(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/quotes/${quote.id}/sub-link`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        const ok = await copyToClipboard(data.url);
        if (ok) {
          setCopiedSub(true);
          setTimeout(() => setCopiedSub(false), 2500);
        } else {
          prompt(t('copy_crew_link') + ':', data.url);
        }
      } else {
        alert(t('could_not_get_crew_link') + ': ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert(t('could_not_get_crew_link') + ': ' + e.message);
    } finally {
      setGettingSubLink(false);
    }
  };

  const handleSend = async () => {
    const updated = await handleStatus('Sent');
    if (updated) setShowShare(true);
  };

  const handleSaveSchedule = async () => {
    if (!schedDate) return;
    setScheduling(true);
    try {
      const updated = await updateQuote(quote.id, { scheduled_date: schedDate, scheduled_time: schedTime || null, assigned_to: assignedTo || null });
      setQuote(updated);
      setShowSchedule(false);
    } catch (e) {
      alert(t('could_not_save_schedule') + ': ' + (e.error || e.message || 'Unknown error'));
    } finally {
      setScheduling(false);
    }
  };

  const handleTranslate = async (targetLanguage) => {
    setTranslating(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/quotes/${quote.id}/translate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      setQuote(data);
    } catch (e) {
      alert('Translate failed: ' + e.message);
    } finally {
      setTranslating(false);
    }
  };

  const handleMarkComplete = async () => {
    if (profile?.review_link && !confirm(t('confirm_mark_complete'))) return;
    await handleStatus('Completed');
  };

  const STATUS_ACTIONS = {
    Draft: [{ label: 'Send Quote', Icon: Send, action: handleSend, variant: 'primary' }, { label: 'Edit', Icon: Pencil, action: () => router.push(`/quotes/${quote.id}/edit`), variant: 'secondary' }],
    Sent: [{ label: 'Mark Approved', Icon: CheckCircle2, action: () => handleStatus('Approved'), variant: 'success' }, { label: 'Mark Rejected', Icon: XCircle, action: () => handleStatus('Rejected'), variant: 'danger' }],
    Approved: [{ label: t('mark_job_complete'), Icon: Flag, action: handleMarkComplete, variant: 'success' }, { label: quote.scheduled_date ? t('reschedule') : t('schedule_job'), Icon: Calendar, action: () => setShowSchedule(true), variant: 'secondary' }, { label: 'Download PDF', Icon: FileText, action: handleDownloadPDF, variant: 'secondary' }],
    Completed: [{ label: 'Download PDF', Icon: FileText, action: handleDownloadPDF, variant: 'primary' }],
    Rejected: [{ label: 'Duplicate', Icon: CopyIcon, action: () => {}, variant: 'secondary' }],
  };

  return (
    <AppShell>
      <PageHeader
        title={`Quote #${quote.number}`}
        subtitle={quote.customer_name}
        onBack={() => router.push('/quotes')}
        action={<Badge status={quote.status} />}
      />

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        {/* Customer + amount hero */}
        <Card style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', border: 'none', marginBottom: 16, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer</p>
              <p style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: '0 0 2px', fontFamily: "'Sora', sans-serif" }}>{quote.customer_name || 'No customer'}</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 }}>{quote.address || 'No address'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 4px' }}>TOTAL</p>
              <p style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: 0, fontFamily: "'Sora', sans-serif" }}>${(quote.total || 0).toLocaleString()}</p>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Created {new Date(quote.created_at).toLocaleDateString()}</span>
            {quote.sent_at && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Sent {new Date(quote.sent_at).toLocaleDateString()}</span>}
            {quote.scheduled_date && (
              <span style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> {t('scheduled_label')} {new Date(quote.scheduled_date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}{quote.scheduled_time ? ` · ${quote.scheduled_time}` : ''}
              </span>
            )}
            {quote.assigned_to && (
              <span style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <HardHat size={12} /> {quote.assigned_to}
              </span>
            )}
          </div>
        </Card>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {(STATUS_ACTIONS[quote.status] || []).map(a => (
            <Btn key={a.label} onClick={a.action} variant={a.variant} loading={updating} size="sm" style={{ flex: 1 }}>
              <a.Icon size={15} /> {a.label}
            </Btn>
          ))}
          <Btn onClick={async () => { if (quote.status === 'Draft') { const updated = await handleStatus('Sent'); if (!updated) return; } setShowShare(true); }} variant="secondary" size="sm"><Link2 size={15} /> Share</Btn>
          <Btn onClick={handleDownloadPDF} variant="secondary" size="sm"><FileText size={15} /> PDF</Btn>
          <Btn onClick={() => handleTranslate(quote.language === 'es' ? 'en' : 'es')} variant="secondary" size="sm" loading={translating}>
            <Globe size={15} /> {quote.language === 'es' ? 'Translate to English' : 'Translate to Español'}
          </Btn>
        </div>

        {/* Line items */}
        <Card style={{ marginBottom: 16 }}>
          <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Scope of Work</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(quote.line_items || []).map((item, i) => (
              <div key={item.id || i} style={{ paddingBottom: 12, borderBottom: i < quote.line_items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: 0, flex: 1 }}>{item.task}</p>
                  <p style={{ color: '#2563eb', fontSize: 14, fontWeight: 800, margin: 0, marginLeft: 10 }}>${(item.price * item.qty).toLocaleString()}</p>
                </div>
                {item.desc && <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 4px', lineHeight: 1.4 }}>{item.desc}</p>}
                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{item.qty} {item.unit} × ${Number(item.price).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
            {quote.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>Tax {quote.tax_type === 'percent' ? `(${quote.tax_value}%)` : ''}</span>
                <span style={{ color: '#0f172a', fontSize: 13 }}>${Number(quote.tax_amount).toFixed(2)}</span>
              </div>
            )}
            {quote.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>Discount {quote.discount_type === 'percent' ? `(${quote.discount_value}%)` : ''}</span>
                <span style={{ color: '#dc2626', fontSize: 13 }}>-${Number(quote.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Total</span>
              <span style={{ color: '#2563eb', fontSize: 20, fontWeight: 900 }}>${(quote.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Follow-up toggle (Premium) */}
        {quote.status === 'Sent' && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>Auto Follow-Ups</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>{profile?.plan !== 'premium' && <Star size={12} strokeWidth={2.25} />}{profile?.plan === 'premium' ? '24h, 3 day, 7 day reminders' : 'Premium feature'}</p>
              </div>
              <button
                onClick={handleToggleFollowup}
                style={{ width: 48, height: 28, borderRadius: 14, background: quote.followup_enabled ? '#2563eb' : '#e2e8f0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', position: 'absolute', top: 3, left: quote.followup_enabled ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          </Card>
        )}

        {/* Signature */}
        {quote.signature_data && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>{t('customer_signature')}</p>
            <img src={quote.signature_data} alt="Customer signature" style={{ maxWidth: 220, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: 8 }} />
            <p style={{ color: '#64748b', fontSize: 12, margin: '8px 0 0' }}>
              {t('signed_by', quote.signature_name || 'customer', quote.signed_at ? new Date(quote.signed_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US') : null)}
            </p>
          </Card>
        )}

        {/* Review request status */}
        {quote.status === 'Completed' && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>{t('review_request_title')}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
              {quote.review_requested_at
                ? t('review_sent_on', new Date(quote.review_requested_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US'))
                : profile?.review_link
                  ? t('review_not_sent_has_link')
                  : t('review_not_sent_no_link')}
            </p>
          </Card>
        )}

        {/* Job Timeline */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{t('job_timeline')}</p>
            <button onClick={handleCopySubLink} disabled={gettingSubLink} style={{ background: copiedSub ? '#f0fdf4' : '#eff6ff', border: `1px solid ${copiedSub ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 8, padding: '5px 10px', color: copiedSub ? '#16a34a' : '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <HardHat size={13} /> {copiedSub ? t('link_copied') : t('copy_crew_link')}
            </button>
          </div>
          {authToken && (
            <Timeline quoteId={quote.id} role="contractor" authToken={authToken} authorName={profile?.owner_name || profile?.company_name} canLogUpdates lang={language} />
          )}
        </div>

        {/* Job Photos */}
        {quote.photos && quote.photos.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Job Photos</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {quote.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Transcript */}
        {quote.transcript && (
          <Card style={{ marginBottom: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Voice Transcript</p>
            <p style={{ color: '#475569', fontSize: 13, margin: 0, lineHeight: 1.6 }}>{quote.transcript}</p>
          </Card>
        )}

        {/* Danger zone */}
        <Btn onClick={handleDelete} variant="danger" fullWidth>Delete Quote</Btn>
      </div>

      {/* Schedule sheet */}
      <BottomSheet open={showSchedule} onClose={() => setShowSchedule(false)} title={t('schedule_job')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, maxWidth: '100%' }}>
          <Input label={t('date_label')} type="date" value={schedDate} onChange={setSchedDate} required />
          <Input label={t('time_optional')} type="time" value={schedTime} onChange={setSchedTime} />
          <Input label={t('assigned_to_optional')} placeholder={t('assigned_to_placeholder')} value={assignedTo} onChange={setAssignedTo} />
          <Btn onClick={handleSaveSchedule} variant="primary" fullWidth loading={scheduling} disabled={!schedDate}>{t('save_schedule')}</Btn>
          {quote.customer_email && <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, textAlign: 'center' }}>{t('customer_gets_email', !!schedTime)}</p>}
        </div>
      </BottomSheet>

      {/* Share sheet */}
      <BottomSheet open={showShare} onClose={() => setShowShare(false)} title="Share Quote">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quoteUrl}</p>
            <button onClick={handleCopyLink} style={{ background: copied ? '#f0fdf4' : '#eff6ff', border: `1px solid ${copied ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 8, padding: '6px 12px', color: copied ? '#16a34a' : '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
              {copied ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Check size={13} strokeWidth={3} /> Copied!</span> : 'Copy'}
            </button>
          </div>
          {quote.customer_email && (
            <a
              href={`mailto:${quote.customer_email}?subject=${encodeURIComponent(`Your Estimate from ${profile?.company_name || 'Us'}`)}&body=${encodeURIComponent(`Hi, please review your estimate here: ${quoteUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block' }}
            >
              <Btn fullWidth variant="primary"><Mail size={16} /> Email to {quote.customer_email}</Btn>
            </a>
          )}
          <a
            href={`sms:?body=${encodeURIComponent(`Hi! Your estimate from ${profile?.company_name} is ready. View it here: ${quoteUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block' }}
          >
            <Btn fullWidth variant="secondary"><MessageSquare size={16} /> Send via SMS</Btn>
          </a>
          <Btn onClick={() => { setShowShare(false); handleDownloadPDF(); }} variant="secondary" fullWidth><FileText size={16} /> Download PDF</Btn>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
