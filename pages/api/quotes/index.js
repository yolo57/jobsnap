import { createClient } from '@supabase/supabase-js';
import { canCreateQuote } from '../../../lib/stripe';

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // GET - list quotes
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST - create quote
  if (req.method === 'POST') {
    // Check quota
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!canCreateQuote(profile)) {
      return res.status(403).json({ error: 'QUOTA_EXCEEDED', plan: profile.plan, used: profile.quotes_used_this_month });
    }

    const { customer_name, customer_email, address, transcript, line_items, notes, customer_id, tax_type, tax_value, discount_type, discount_value } = req.body;
    const items = line_items || [];
    const subtotal = items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
    const taxableSubtotal = items.filter(i => i.taxable).reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
    const taxType = tax_type === 'flat' ? 'flat' : 'percent';
    const taxVal = Number(tax_value) || 0;
    // No items marked taxable -> no tax, regardless of the rate entered.
    const tax_amount = taxableSubtotal <= 0 ? 0 : (taxType === 'percent' ? taxableSubtotal * (taxVal / 100) : taxVal);
    const discountType = discount_type === 'percent' ? 'percent' : 'flat';
    const discountVal = Number(discount_value) || 0;
    const rawDiscount = discountType === 'percent' ? subtotal * (discountVal / 100) : discountVal;
    const discountAmt = Math.min(Math.max(rawDiscount, 0), subtotal + tax_amount);
    const total = subtotal + tax_amount - discountAmt;

    // Get next quote number
    const { data: numData } = await supabase.rpc('get_next_quote_number', { p_user_id: user.id });
    const number = numData || 1001;

    const { data, error } = await supabase.from('quotes').insert({
      user_id: user.id,
      number,
      customer_id: customer_id || null,
      customer_name,
      customer_email,
      address,
      transcript,
      line_items: items,
      subtotal,
      tax_type: taxType,
      tax_value: taxVal,
      tax_rate: taxType === 'percent' ? taxVal : 0,
      tax_amount,
      discount_type: discountType,
      discount_value: discountVal,
      discount_amount: discountAmt,
      total,
      notes,
      status: 'Draft',
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    // Increment usage counter
    await supabase.from('profiles').update({
      quotes_used_this_month: (profile.quotes_used_this_month || 0) + 1
    }).eq('id', user.id);

    return res.status(201).json(data);
  }

  return res.status(405).end();
}
