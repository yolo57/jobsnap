import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { id } = req.query;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: quote, error } = await supabase.from('quotes').select('id, sub_token').eq('id', id).eq('user_id', user.id).single();
  if (error || !quote) return res.status(404).json({ error: 'Not found' });

  let subToken = quote.sub_token;
  if (!subToken) {
    subToken = crypto.randomBytes(9).toString('base64url');
    const { error: updateError } = await supabase.from('quotes').update({ sub_token: subToken }).eq('id', id);
    if (updateError) return res.status(500).json({ error: updateError.message });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return res.status(200).json({ url: `${baseUrl}/job/${id}?t=${subToken}` });
}
