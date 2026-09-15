import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Send, Loader2, X } from 'lucide-react';

const ROLE_LABEL = { contractor: 'Contractor', sub: 'Crew', customer: 'Customer' };
const ROLE_COLOR = {
  contractor: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a5f' },
  sub: { bg: '#f8fafc', border: '#e2e8f0', text: '#334155' },
  customer: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
};

// Drop-in job timeline: progress updates (with photos) + two-way chat.
// Works for the contractor (auth token), a subcontractor (link token, no login),
// or the customer (public quote link, no auth) — pass the right props for each.
export default function Timeline({ quoteId, role, authToken, subToken, authorName, canLogUpdates }) {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [postAsUpdate, setPostAsUpdate] = useState(!!canLogUpdates);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const withToken = useCallback((url) => (subToken ? `${url}${url.includes('?') ? '&' : '?'}t=${encodeURIComponent(subToken)}` : url), [subToken]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(withToken(`/api/quotes/${quoteId}/timeline`), { headers: authHeaders });
      if (res.ok) setEntries(await res.json());
    } catch (e) { /* silent poll failure */ }
    finally { setLoaded(true); }
  }, [quoteId, withToken]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'nearest' }); }, [entries.length]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        if (subToken) fd.append('token', subToken);
        const res = await fetch(`/api/quotes/${quoteId}/timeline-photo`, { method: 'POST', headers: authHeaders, body: fd });
        const data = await res.json();
        if (res.ok) setPendingPhotos(p => [...p, data.url]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!text.trim() && pendingPhotos.length === 0) return;
    setSending(true);
    try {
      const entryType = role === 'customer' ? 'message' : (postAsUpdate ? 'update' : 'message');
      const res = await fetch(withToken(`/api/quotes/${quoteId}/timeline`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ message: text.trim() || null, photos: pendingPhotos, authorName, entryType, token: subToken }),
      });
      if (res.ok) {
        const entry = await res.json();
        setEntries(e => [...e, entry]);
        setText('');
        setPendingPhotos([]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Job Timeline</p>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loaded && entries.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>No updates yet.</p>
        )}
        {entries.map(entry => {
          const c = ROLE_COLOR[entry.role] || ROLE_COLOR.sub;
          return (
            <div key={entry.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: '10px 14px', maxWidth: '88%', alignSelf: entry.role === 'customer' ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: c.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {entry.author_name || ROLE_LABEL[entry.role]}{entry.entry_type === 'update' ? ' · update' : ''}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              {entry.message && <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{entry.message}</p>}
              {entry.photos?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {entry.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
        {canLogUpdates && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={() => setPostAsUpdate(true)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: postAsUpdate ? '#2563eb' : '#e2e8f0', color: postAsUpdate ? '#fff' : '#64748b' }}>Progress update</button>
            <button onClick={() => setPostAsUpdate(false)} style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: !postAsUpdate ? '#2563eb' : '#e2e8f0', color: !postAsUpdate ? '#fff' : '#64748b' }}>Message customer</button>
          </div>
        )}

        {pendingPhotos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {pendingPhotos.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                <button onClick={() => setPendingPhotos(p => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, background: '#0f172a', border: '2px solid #fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <X size={10} color="#fff" strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={role === 'customer' ? 'Send a message...' : postAsUpdate ? "What'd you get done today?" : 'Message the customer...'}
            rows={1}
            style={{ flex: 1, resize: 'none', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", outline: 'none', maxHeight: 80 }}
          />
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={handleFiles} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {uploading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} color="#64748b" /> : <Camera size={16} color="#64748b" />}
          </button>
          <button onClick={handleSend} disabled={sending || (!text.trim() && pendingPhotos.length === 0)} style={{ background: (!text.trim() && pendingPhotos.length === 0) ? '#cbd5e1' : '#2563eb', border: 'none', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Send size={15} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
