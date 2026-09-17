import { createClient } from '@supabase/supabase-js';

// Public endpoint behind a contractor's shareable "Request a Quote" link.
// GET returns just enough branding to render the form; POST files the lead
// as a Draft quote so it shows up in the contractor's normal Quotes list,
// ready for them to fill in line items or record a walk-through for it.
export default async function handler(req, res) {
  const { id } = req.query;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('profiles').select('company_name, logo_url, phone').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { customer_name, customer_phone, customer_email, address, description } = req.body || {};
    if (!customer_name || !customer_name.trim()) return res.status(400).json({ error: 'Name is required.' });

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', id).single();
    if (!profile) return res.status(404).json({ error: 'Not found' });

    const { data: numData } = await supabase.rpc('get_next_quote_number', { p_user_id: id });
    const number = numData || 1001;

    const { error } = await supabase.from('quotes').insert({
      user_id: id,
      number,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      address: address || null,
      notes: description || null,
      status: 'Draft',
      source: 'lead_form',
      line_items: [],
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
