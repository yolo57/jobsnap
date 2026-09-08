import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useQuotes } from '../../hooks/useQuotes';
import AppShell from '../../components/layout/AppShell';
import { Sparkles, Camera, X, Plus } from 'lucide-react';
import { Card, Input, Btn, PageHeader, Spinner, UpgradeWall } from '../../components/ui';
import { quotesRemaining } from '../../lib/stripe';

export default function NewQuote() {
  const router = useRouter();
  const { user, profile, getToken } = useAuth();
  const { createQuote, updateQuote } = useQuotes();
  const [lineItems, setLineItems] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [scope, setScope] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [taxType, setTaxType] = useState('percent'); // 'percent' | 'flat'
  const [taxValue, setTaxValue] = useState(0);
  const [discountType, setDiscountType] = useState('flat'); // 'percent' | 'flat'
  const [discountValue, setDiscountValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [photos, setPhotos] = useState([]); // { id, dataUrl, file? }
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    // Load pending quote from recording
    const pending = sessionStorage.getItem('pendingQuote');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        setLineItems((data.lineItems || []).map(i => ({ taxable: false, ...i })));
        setTranscript(data.transcript || '');
        setScope(data.scope || '');
        setPhotos((data.photos || []).map((dataUrl, i) => ({ id: 'ph_' + i, dataUrl })));
        sessionStorage.removeItem('pendingQuote');
      } catch (e) {}
    } else {
      // Manual new quote — add one empty line item
      setLineItems([{ id: 'li_' + Date.now(), task: '', desc: '', qty: 1, unit: 'ea', price: 0, taxable: false }]);
    }
    // Check quota
    if (profile && quotesRemaining(profile) === 0) setShowUpgrade(true);
  }, [user, profile]);

  useEffect(() => {
    // Prefill the tax rate from the contractor's default, once, when it loads.
    if (profile?.tax_rate) setTaxValue(profile.tax_rate);
  }, [profile?.tax_rate]);

  const updateItem = (id, field, val) => setLineItems(items => items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addItem = () => setLineItems(items => [...items, { id: 'li_' + Date.now(), task: '', desc: '', qty: 1, unit: 'ea', price: 0, taxable: false }]);
  const removeItem = (id) => setLineItems(items => items.filter(i => i.id !== id));

  const dataUrlToBlob = (dataUrl) => {
    const [meta, b64] = dataUrl.split(',');
    const mime = meta.match(/:(.*?);/)[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(p => [...p, { id: 'ph_' + Date.now() + Math.random(), dataUrl: reader.result }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (id) => setPhotos(p => p.filter(ph => ph.id !== id));

  const uploadPhotos = async (quoteId) => {
    const token = await getToken();
    const urls = [];
    for (const photo of photos) {
      try {
        const blob = dataUrlToBlob(photo.dataUrl);
        const formData = new FormData();
        formData.append('file', blob, 'photo.jpg');
        formData.append('quote_id', quoteId);
        const res = await fetch('/api/upload-quote-photo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const { url } = await res.json();
          urls.push(url);
        }
      } catch (e) {
        console.error('Photo upload failed:', e);
      }
    }
    if (urls.length > 0) {
      await updateQuote(quoteId, { photos: urls });
    }
  };

  const subtotal = lineItems.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
  const taxableSubtotal = lineItems.filter(i => i.taxable).reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
  // No items marked taxable → no tax, regardless of rate entered.
  const tax = taxableSubtotal <= 0 ? 0 : (taxType === 'percent' ? taxableSubtotal * ((Number(taxValue) || 0) / 100) : (Number(taxValue) || 0));
  const rawDiscount = discountType === 'percent' ? subtotal * ((Number(discountValue) || 0) / 100) : (Number(discountValue) || 0);
  const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal + tax);
  const total = subtotal + tax - discountAmount;

  const handleSave = async () => {
    setSaving(true);
    try {
      const quote = await createQuote({
        customer_name: customerName,
        customer_email: customerEmail,
        address,
        transcript,
        line_items: lineItems,
        notes,
        tax_type: taxType,
        tax_value: Number(taxValue) || 0,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
      });
      if (quote?.error === 'QUOTA_EXCEEDED') { setShowUpgrade(true); return; }
      if (photos.length > 0) await uploadPhotos(quote.id);
      router.push(`/quotes/${quote.id}`);
    } catch (e) {
      if (e.error === 'QUOTA_EXCEEDED') setShowUpgrade(true);
      else alert('Error saving: ' + (e.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async (plan) => {
    const token = await getToken();
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  if (!user) return null;

  const typeToggle = (value, onChange) => (
    <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 2, gap: 2 }}>
      <button onClick={() => onChange('percent')} style={{ border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: value === 'percent' ? '#2563eb' : 'transparent', color: value === 'percent' ? '#fff' : '#64748b' }}>%</button>
      <button onClick={() => onChange('flat')} style={{ border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: value === 'flat' ? '#2563eb' : 'transparent', color: value === 'flat' ? '#fff' : '#64748b' }}>$</button>
    </div>
  );

  return (
    <AppShell>
      {showUpgrade && <UpgradeWall plan={profile?.plan} quotesUsed={profile?.quotes_used_this_month} onUpgrade={handleUpgrade} />}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PageHeader title="New Estimate" onBack={() => router.back()} action={
          <Btn onClick={handleSave} size="sm" loading={saving}>Save</Btn>
        } />

        {scope && (
          <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '12px 20px' }}>
            <p style={{ color: '#1d4ed8', fontSize: 13, margin: 0, lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}><Sparkles size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span><strong>AI Summary:</strong> {scope}</span></p>
          </div>
        )}

        <div style={{ padding: '16px', overflowY: 'auto' }}>
          {/* Customer info */}
          <Card style={{ marginBottom: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Customer</p>
            <Input label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="John Smith" />
            <Input label="Email" type="email" value={customerEmail} onChange={setCustomerEmail} placeholder="customer@email.com" hint="Used for follow-up emails" />
            <Input label="Job Address" value={address} onChange={setAddress} placeholder="123 Main St, City, State" style={{ marginBottom: 0 }} />
          </Card>

          {/* Line items */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Line Items</p>
              <button onClick={addItem} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '5px 12px', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ Add</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lineItems.map((item, idx) => (
                <Card key={item.id} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>Item {idx + 1}</span>
                    {lineItems.length > 1 && (
                      <button onClick={() => removeItem(item.id)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
                    )}
                  </div>
                  <Input value={item.task} onChange={v => updateItem(item.id, 'task', v)} placeholder="Task name (e.g. Replace garage door)" style={{ marginBottom: 8 }} />
                  <Input value={item.desc} onChange={v => updateItem(item.id, 'desc', v)} placeholder="Description (optional)" multiline rows={2} style={{ marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input label="Qty" value={String(item.qty)} onChange={v => updateItem(item.id, 'qty', v)} type="number" style={{ flex: 1, marginBottom: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</p>
                      <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ width: '100%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                        {['ea', 'hr', 'sqft', 'lnft', 'lot'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <Input label="Price ($)" value={String(item.price)} onChange={v => updateItem(item.id, 'price', v)} type="number" style={{ flex: 1, marginBottom: 0 }} />
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 600 }}>
                      <input type="checkbox" checked={!!item.taxable} onChange={e => updateItem(item.id, 'taxable', e.target.checked)} />
                      Taxable
                    </label>
                    <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 700 }}>
                      ${(Number(item.price) * Number(item.qty)).toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Photos</p>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <img src={p.dataUrl} style={{ width: 76, height: 76, borderRadius: 12, objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
                  <button onClick={() => removePhoto(p.id)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, background: '#dc2626', border: '2px solid #fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                    <X size={11} strokeWidth={3} />
                  </button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} style={{ width: 76, height: 76, borderRadius: 12, border: '1.5px dashed #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: '#64748b' }}>
                <Plus size={18} />
                <span style={{ fontSize: 10, fontWeight: 700 }}>Add</span>
              </button>
            </div>
          </div>

                    {/* Totals */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: 14 }}>Subtotal</span>
                <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 600 }}>${subtotal.toLocaleString()}</span>
              </div>

              {/* Tax */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Tax {taxType === 'percent' ? '(on taxable items)' : ''}</span>
                  {typeToggle(taxType, setTaxType)}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={taxValue} onChange={e => setTaxValue(e.target.value)} min="0" step="0.01" placeholder={taxType === 'percent' ? '8.25' : '0.00'} style={{ flex: 1, background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', color: '#0f172a', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                  {taxType === 'percent' && (
                    <button onClick={() => setTaxValue(8.25)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 10px', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>TX 8.25%</button>
                  )}
                  <span style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: 'right' }}>${tax.toFixed(2)}</span>
                </div>
                {taxableSubtotal <= 0 && (
                  <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0 0' }}>No items marked "Taxable" — tax is $0.</p>
                )}
              </div>

              {/* Discount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Discount</span>
                  {typeToggle(discountType, setDiscountType)}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} min="0" step="0.01" placeholder="0.00" style={{ flex: 1, background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', color: '#0f172a', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                  <span style={{ color: '#dc2626', fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: 'right' }}>-${discountAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#0f172a', fontSize: 16, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Total</span>
                <span style={{ color: '#2563eb', fontSize: 20, fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>${total.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: 24 }}>
            <Input label="Notes" value={notes} onChange={setNotes} placeholder={profile?.quote_notes || 'Thank you for your business!'} multiline rows={3} style={{ marginBottom: 0 }} />
          </Card>

          <Btn onClick={handleSave} fullWidth size="lg" loading={saving}>Save Estimate</Btn>
        </div>
      </div>
    </AppShell>
  );
}
