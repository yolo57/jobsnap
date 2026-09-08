import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { id } = req.query;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Public GET for shareable quote page
  if (req.method === 'GET' && !req.headers.authorization) {
    const { data, error } = await supabase.from('quotes').select('*, profiles(company_name, phone, email, logo_url, owner_name, license_number, payment_terms, quote_notes)').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Quote not found' });
    if (!['Sent', 'Approved', 'Rejected'].includes(data.status)) return res.status(403).json({ error: 'Not available' });
    return res.status(200).json(data);
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // GET single quote (authenticated)
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('quotes').select('*').eq('id', id).eq('user_id', user.id).single();
    if (error) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(data);
  }

  // PATCH - update quote
  if (req.method === 'PATCH') {
    const updates = req.body;
    // Recalculate totals if line items, tax, or discount changed
    const touchesTotals = updates.line_items || updates.tax_type !== undefined || updates.tax_value !== undefined || updates.discount_type !== undefined || updates.discount_value !== undefined;
    if (touchesTotals) {
      const { data: existing } = await supabase.from('quotes').select('line_items, tax_type, tax_value, discount_type, discount_value').eq('id', id).single();
      const items = updates.line_items || existing?.line_items || [];
      const subtotal = items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
      const taxableSubtotal = items.filter(i => i.taxable).reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
      const taxType = updates.tax_type ?? existing?.tax_type ?? 'percent';
      const taxVal = Number(updates.tax_value ?? existing?.tax_value ?? 0) || 0;
      // No items marked taxable -> no tax, regardless of the rate entered.
      const tax_amount = taxableSubtotal <= 0 ? 0 : (taxType === 'percent' ? taxableSubtotal * (taxVal / 100) : taxVal);
      const discountType = updates.discount_type ?? existing?.discount_type ?? 'flat';
      const discountVal = Number(updates.discount_value ?? existing?.discount_value ?? 0) || 0;
      const rawDiscount = discountType === 'percent' ? subtotal * (discountVal / 100) : discountVal;
      const discountAmt = Math.min(Math.max(rawDiscount, 0), subtotal + tax_amount);

      updates.subtotal = subtotal;
      updates.tax_type = taxType;
      updates.tax_value = taxVal;
      updates.tax_rate = taxType === 'percent' ? taxVal : 0;
      updates.tax_amount = tax_amount;
      updates.discount_type = discountType;
      updates.discount_value = discountVal;
      updates.discount_amount = discountAmt;
      updates.total = subtotal + tax_amount - discountAmt;
    }
    if (updates.status === 'Sent' && !updates.sent_at) updates.sent_at = new Date().toISOString();
    if (updates.status === 'Approved') updates.approved_at = new Date().toISOString();

    const { data, error } = await supabase.from('quotes').update(updates).eq('id', id).eq('user_id', user.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('quotes').delete().eq('id', id).eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
