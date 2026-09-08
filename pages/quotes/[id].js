import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useQuotes } from '../../hooks/useQuotes';
import AppShell from '../../components/layout/AppShell';
import { Send, Pencil, CheckCircle2, XCircle, FileText, Copy as CopyIcon, Link2, Globe, Mail, MessageSquare, Check, Star } from 'lucide-react';
import { Card, Badge, Btn, PageHeader, Spinner, BottomSheet } from '../../components/ui';

export default function QuoteDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, profile, getToken } = useAuth();
  const { quotes, updateQuote, deleteQuote } = useQuotes();
  const [quote, setQuote] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (id && quotes.length > 0) {
      const q = quotes.find(q => q.id === id);
      if (q) setQuote(q);
    }
  }, [id, quotes, user]);

  if (!user || !quote) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={32} /></div>;

  const isPro = profile?.plan === 'pro' || profile?.plan === 'premium';
  const quoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/${quote.id}`;

  const handleStatus = async (status) => {
    setUpdating(true);
    const updated = await updateQuote(quote.id, { status });
    setQuote(updated);
    setUpdating(false);
  };

  const handleToggleFollowup = async () => {
    if (profile?.plan !== 'premium') {
      alert('Automated follow-ups are a Premium feature. Upgrade to enable.');
      return;
    }
    const updated = await updateQuote(quote.id, { followup_enabled: !quote.followup_enabled });
    setQuote(updated);
  };

  const handleDownloadPDF = async () => {
    const { downloadQuotePDF } = await import('../../lib/pdf');
    await downloadQuotePDF(quote, profile);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this quote? This cannot be undone.')) return;
    await deleteQuote(quote.id);
    router.push('/quotes');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    await handleStatus('Sent');
    setShowShare(true);
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

  const STATUS_ACTIONS = {
    Draft: [{ label: 'Send Quote', Icon: Send, action: handleSend, variant: 'primary' }, { label: 'Edit', Icon: Pencil, action: () => router.push(`/quotes/${quote.id}/edit`), variant: 'secondary' }],
    Sent: [{ label: 'Mark Approved', Icon: CheckCircle2, action: () => handleStatus('Approved'), variant: 'success' }, { label: 'Mark Rejected', Icon: XCircle, action: () => handleStatus('Rejected'), variant: 'danger' }],
    Approved: [{ label: 'Download PDF', Icon: FileText, action: handleDownloadPDF, variant: 'primary' }],
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
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: 20 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Created {new Date(quote.created_at).toLocaleDateString()}</span>
            {quote.sent_at && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Sent {new Date(quote.sent_at).toLocaleDateString()}</span>}
          </div>
        </Card>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {(STATUS_ACTIONS[quote.status] || []).map(a => (
            <Btn key={a.label} onClick={a.action} variant={a.variant} loading={updating} size="sm" style={{ flex: 1 }}>
              <a.Icon size={15} /> {a.label}
            </Btn>
          ))}
          <Btn onClick={async () => { if (quote.status === 'Draft') await handleStatus('Sent'); setShowShare(true); }} variant="secondary" size="sm"><Link2 size={15} /> Share</Btn>
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
