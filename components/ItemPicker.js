import { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BottomSheet, Spinner, EmptyState } from './ui';

// Bottom sheet used from both the New Estimate and Edit Estimate screens to
// insert one of the contractor's own saved items (their price book) as a
// line item, instead of typing the same material/service text every time.
export default function ItemPicker({ open, onClose, userId, onSelect, t }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    supabase.from('saved_items').select('*').eq('user_id', userId).order('task', { ascending: true })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, [open, userId]);

  const filtered = items.filter(i => (i.task || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <BottomSheet open={open} onClose={onClose} title={t('my_items')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
        <Search size={15} color="#94a3b8" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search_items')}
          style={{ flex: 1, background: 'none', border: 'none', color: '#0f172a', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package size={32} strokeWidth={1.75} />} title={t('no_saved_items')} sub={t('no_saved_items_sub')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 14 }}>{item.task}</span>
                <span style={{ color: '#2563eb', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>${Number(item.price || 0).toLocaleString()}<span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>/{item.unit || 'ea'}</span></span>
              </div>
              {item.description && <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>{item.description}</p>}
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
