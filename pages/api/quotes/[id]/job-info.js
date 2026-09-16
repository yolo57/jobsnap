import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { id, t } = req.query;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('id, customer_name, address, sub_token, status, language, profiles(company_name, owner_name, phone)')
    .eq('id', id)
    .single();
  if (error || !quote) return res.status(404).json({ error: 'Not found' });
  if (!quote.sub_token || t !== quote.sub_token) return res.status(403).json({ error: 'Invalid or expired link' });

  return res.status(200).json({
    customerName: quote.customer_name,
    address: quote.address,
    status: quote.status,
    language: quote.language || 'en',
    companyName: quote.profiles?.company_name,
    ownerName: quote.profiles?.owner_name,
    phone: quote.profiles?.phone,
  });
}
