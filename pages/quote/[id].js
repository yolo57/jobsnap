import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { Phone, Mail, CheckCircle2, Check, Eraser, PenLine, Calendar } from 'lucide-react';
import Timeline from '../../components/Timeline';

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * ratio;
    canvas.height = canvas.clientHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawn.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasDrawn.current) onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange(null);
  };

  return (
    <div>
      <div style={{ position: 'relative', border: '1.5px dashed #cbd5e1', borderRadius: 12, background: '#f8fafc', height: 140 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        {!hasDrawn.current && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#cbd5e1', fontSize: 13, gap: 6 }}>
            <PenLine size={14} /> Sign here
          </div>
        )}
      </div>
      <button onClick={clear} style={{ marginTop: 8, background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}>
        <Eraser size={12} /> Clear
      </button>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/quotes/${params.id}`);
    if (!res.ok) return { notFound: true };
    const quote = await res.json();
    return { props: { quote } };
  } catch (e) {
    return { notFound: true };
  }
}

export default function PublicQuotePage({ quote }) {
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(quote.status === 'Approved' || quote.status === 'Completed');
  const [showSignStep, setShowSignStep] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState(null);
  const [signedInfo, setSignedInfo] = useState(quote.signature_name ? { name: quote.signature_name, at: quote.signed_at } : null);
  const profile = quote.profiles || {};

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData, signerName: signerName || null }),
      });
      if (res.ok) {
        setApproved(true);
        setShowSignStep(false);
        if (signatureData) setSignedInfo({ name: signerName, at: new Date().toISOString() });
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Couldn't approve this estimate: ${data.error || 'Please try again, or call to let them know.'}`);
      }
    } catch (e) {
      alert("Couldn't approve this estimate — check your connection and try again.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Estimate #{quote.number} — {profile.company_name}</title>
        <meta name="description" content={`Professional estimate from ${profile.company_name}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100dvh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Company header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '28px 24px 32px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Estimate from</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {profile.logo_url && <img src={profile.logo_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: '#fff' }} />}
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.5px' }}>{profile.company_name || 'Contractor'}</h1>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {profile.phone && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={13} /> {profile.phone}</span>}
              {profile.email && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={13} /> {profile.email}</span>}
              {profile.license_number && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Lic# {profile.license_number}</span>}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
          {/* Quote summary */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Prepared for</p>
                <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 800, margin: '0 0 2px', fontFamily: "'Sora', sans-serif" }}>{quote.customer_name}</p>
                {quote.address && <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{quote.address}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 4px' }}>ESTIMATE #{quote.number}</p>
                <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {approved && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <CheckCircle2 size={20} color="#16a34a" strokeWidth={2} />
                  <p style={{ color: '#16a34a', fontSize: 14, fontWeight: 700, margin: 0 }}>
                    {quote.status === 'Completed' ? 'Job Completed — thank you!' : "Quote Approved — we'll be in touch soon!"}
                  </p>
                </div>
                {signedInfo?.name && (
                  <p style={{ color: '#15803d', fontSize: 12, margin: '6px 0 0 30px' }}>
                    Signed by {signedInfo.name}{signedInfo.at ? ` on ${new Date(signedInfo.at).toLocaleDateString()}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Line items */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#1e3a5f', padding: '12px 20px' }}>
              <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Scope of Work</p>
            </div>
            <div style={{ padding: '0 20px' }}>
              {(quote.line_items || []).map((item, i) => (
                <div key={i} style={{ padding: '16px 0', borderBottom: i < quote.line_items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <p style={{ color: '#0f172a', fontSize: 15, fontWeight: 700, margin: 0, flex: 1 }}>{item.task}</p>
                    <p style={{ color: '#1e3a5f', fontSize: 15, fontWeight: 800, margin: '0 0 0 12px', fontFamily: "'Sora', sans-serif" }}>${(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  {item.desc && <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 4px', lineHeight: 1.5 }}>{item.desc}</p>}
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{item.qty} {item.unit} @ ${Number(item.price).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '16px 20px' }}>
              {quote.tax_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Tax {quote.tax_type === 'percent' ? `(${quote.tax_value}%)` : ''}</span>
                  <span style={{ color: '#0f172a', fontSize: 14 }}>${Number(quote.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {quote.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Discount {quote.discount_type === 'percent' ? `(${quote.discount_value}%)` : ''}</span>
                  <span style={{ color: '#dc2626', fontSize: 14 }}>-${Number(quote.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0f172a', fontSize: 18, fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>Total Estimate</span>
                <span style={{ color: '#2563eb', fontSize: 26, fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>${(quote.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Scheduled job banner */}
          {quote.scheduled_date && (
            <div style={{ background: '#eff6ff', borderRadius: 16, padding: '16px 20px', border: '1px solid #bfdbfe', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Calendar size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ color: '#1e3a5f', fontSize: 15, fontWeight: 800, margin: '0 0 2px', fontFamily: "'Sora', sans-serif" }}>
                    Job scheduled for {new Date(quote.scheduled_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    {quote.scheduled_time ? ` at ${quote.scheduled_time}` : ''}
                  </p>
                  {quote.address && <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{quote.address}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Job Photos */}
          {quote.photos && quote.photos.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Job Site Photos</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {quote.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} style={{ width: 90, height: 90, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(quote.notes || profile.payment_terms || profile.quote_notes) && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Notes & Terms</p>
              {[quote.notes, profile.payment_terms, profile.quote_notes].filter(Boolean).map((note, i) => (
                <p key={i} style={{ color: '#475569', fontSize: 13, margin: '0 0 4px', lineHeight: 1.5 }}>{note}</p>
              ))}
            </div>
          )}

          {/* Approve CTA */}
          {!approved && quote.status === 'Sent' && !showSignStep && (
            <button
              onClick={() => setShowSignStep(true)}
              style={{ width: '100%', background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', borderRadius: 16, padding: '18px', cursor: 'pointer', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: "'Sora', sans-serif", boxShadow: '0 4px 16px rgba(22,163,74,0.3)', marginBottom: 12 }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Check size={18} strokeWidth={3} /> Approve This Estimate</span>
            </button>
          )}

          {!approved && quote.status === 'Sent' && showSignStep && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#0f172a', fontSize: 15, fontWeight: 800, margin: '0 0 12px', fontFamily: "'Sora', sans-serif" }}>Sign to approve</p>
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Your full name</label>
              <input
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Jane Doe"
                style={{ width: '100%', boxSizing: 'border-box', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}
              />
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Signature</label>
              <SignaturePad onChange={setSignatureData} />
              <button
                onClick={handleApprove}
                disabled={approving || !signatureData || !signerName.trim()}
                style={{ width: '100%', marginTop: 16, background: (!signatureData || !signerName.trim()) ? '#cbd5e1' : 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', borderRadius: 14, padding: '16px', cursor: (!signatureData || !signerName.trim()) ? 'default' : 'pointer', color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}
              >
                {approving ? 'Approving...' : 'Confirm & Approve'}
              </button>
            </div>
          )}

          {['Sent', 'Approved', 'Completed'].includes(quote.status) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Job Updates</p>
              <Timeline quoteId={quote.id} role="customer" authorName={quote.customer_name || 'Customer'} />
            </div>
          )}

          {profile.phone && (
            <div style={{ textAlign: 'center' }}>
              <a href={`tel:${profile.phone}`} style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Questions? Call {profile.phone}
              </a>
            </div>
          )}

          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: 11, marginTop: 32 }}>Powered by JobSnap</p>
        </div>
      </div>
    </>
  );
}
