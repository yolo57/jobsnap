import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Search, Users, Phone, Mail, MapPin, Mic } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import { Card, PageHeader, EmptyState, Btn, Input, BottomSheet, Spinner } from '../components/ui';

export default function CustomersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    const { error } = await supabase.from('customers').insert({ ...form, user_id: user.id });
    setSaving(false);
    if (error) { alert('Could not add client: ' + error.message); return; }
    await loadCustomers();
    setShowAdd(false);
    setForm({ name: '', phone: '', email: '', address: '' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) { alert('Could not delete client: ' + error.message); return; }
    setSelected(null);
    loadCustomers();
  };

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <AppShell>
      <PageHeader title="Customers" action={
        <Btn onClick={() => setShowAdd(true)} size="sm">+ Add</Btn>
      } />

      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', borderRadius: 12, padding: '10px 14px', alignItems: 'center', border: '1px solid #e2e8f0' }}>
          <Search size={18} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ flex: 1, background: 'none', border: 'none', color: '#0f172a', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={44} strokeWidth={1.75} />} title="No customers yet" sub="Add your first customer to get started" action={<Btn onClick={() => setShowAdd(true)}>Add Customer</Btn>} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => {
              const initials = c.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              return (
                <Card key={c.id} onClick={() => setSelected(c)} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#0f172a', fontSize: 14, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    <p style={{ color: '#94a3b8', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.phone || c.email || 'No contact info'}</p>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 20 }}>›</span>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add customer sheet */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="New Customer">
        <Input label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="John Smith" required />
        <Input label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="555-0000" type="tel" />
        <Input label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="john@email.com" type="email" />
        <Input label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="123 Main St" />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={handleAdd} fullWidth loading={saving} disabled={!form.name}>Save Customer</Btn>
          <Btn onClick={() => setShowAdd(false)} variant="secondary" fullWidth>Cancel</Btn>
        </div>
      </BottomSheet>

      {/* Customer detail sheet */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[{ Icon: Phone, val: selected.phone }, { Icon: Mail, val: selected.email }, { Icon: MapPin, val: selected.address }].filter(i => i.val).map(item => (
                <div key={item.val} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <item.Icon size={16} color="#64748b" />
                  <span style={{ color: '#0f172a', fontSize: 14 }}>{item.val}</span>
                </div>
              ))}
            </div>
            <Btn onClick={() => { setSelected(null); router.push(`/record?customerId=${selected.id}`); }} fullWidth style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Mic size={16} /> Record New Job</Btn>
            <Btn onClick={() => handleDelete(selected.id)} variant="danger" fullWidth>Delete Customer</Btn>
          </div>
        )}
      </BottomSheet>
    </AppShell>
  );
}
