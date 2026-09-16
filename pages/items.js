import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getT } from '../lib/i18n';
import { Search, Package, Trash2 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { Card, PageHeader, EmptyState, Btn, Input, BottomSheet, Spinner } from '../components/ui';

const EMPTY_FORM = { task: '', description: '', unit: 'ea', price: '' };

export default function ItemsPage() {
  const router = useRouter();
  const { user, language } = useAuth();
  const t = getT(language);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadItems = async () => {
    const { data, error } = await supabase.from('saved_items').select('*').eq('user_id', user.id).order('task', { ascending: true });
    if (error) { alert(t('could_not_load_items') + ': ' + error.message); setLoading(false); return; }
    setItems(data || []);
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowSheet(true); };
  const openEdit = (item) => { setEditing(item); setForm({ task: item.task || '', description: item.description || '', unit: item.unit || 'ea', price: String(item.price ?? '') }); setShowSheet(true); };

  const handleSave = async () => {
    if (!form.task.trim()) return;
    setSaving(true);
    const payload = { task: form.task.trim(), description: form.description || null, unit: form.unit || 'ea', price: Number(form.price) || 0 };
    const { error } = editing
      ? await supabase.from('saved_items').update(payload).eq('id', editing.id)
      : await supabase.from('saved_items').insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) { alert(t('could_not_save_item') + ': ' + error.message); return; }
    setShowSheet(false);
    loadItems();
  };

  const handleDelete = async (id) => {
    if (!confirm(t('delete_item_confirm'))) return;
    const { error } = await supabase.from('saved_items').delete().eq('id', id);
    if (error) { alert(t('could_not_delete_item') + ': ' + error.message); return; }
    loadItems();
  };

  const filtered = items.filter(i => (i.task || '').toLowerCase().includes(search.toLowerCase()));

  if (!user) return null;

  return (
    <AppShell>
      <PageHeader title={t('item_library')} onBack={() => router.push('/settings')} action={<Btn size="sm" onClick={openAdd}>{t('add_item')}</Btn>} />

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 14px' }}>{t('item_library_desc')}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <Search size={16} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_items')} style={{ flex: 1, background: 'none', border: 'none', color: '#0f172a', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Package size={32} strokeWidth={1.75} />} title={t('no_saved_items')} sub={t('no_saved_items_sub')} action={<Btn onClick={openAdd}>{t('add_item')}</Btn>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => (
              <Card key={item.id} onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>{item.task}</p>
                    {item.description && <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{item.description}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ color: '#2563eb', fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>${Number(item.price || 0).toLocaleString()}<span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 11 }}>/{item.unit || 'ea'}</span></span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={showSheet} onClose={() => setShowSheet(false)} title={editing ? t('edit_item') : t('add_item')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label={t('item_name')} value={form.task} onChange={v => setForm(f => ({ ...f, task: v }))} placeholder="e.g. 30-yr Architectural Shingles" style={{ marginBottom: 0 }} />
          <Input label={t('item_description_label')} value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline rows={2} placeholder={t('item_description_placeholder')} style={{ marginBottom: 0 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</p>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={{ width: '100%', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', color: '#0f172a', fontSize: 15, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                {['ea', 'hr', 'sqft', 'lnft', 'lot'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <Input label="Price ($)" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" style={{ flex: 1, marginBottom: 0 }} />
          </div>
          <Btn onClick={handleSave} fullWidth loading={saving} disabled={!form.task.trim()}>{t('save')}</Btn>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
