import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;
  const { signatureData, signerName } = req.body || {};

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const update = { status: 'Approved', approved_at: new Date().toISOString() };
  if (signatureData) {
    update.signature_data = signatureData;
    update.signature_name = signerName || null;
    update.signed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('quotes')
    .update(update)
    .eq('id', id)
    .in('status', ['Sent']); // only allow approving sent quotes

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
