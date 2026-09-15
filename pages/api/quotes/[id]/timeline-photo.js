import formidable from 'formidable';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

const PUBLIC_STATUSES = ['Sent', 'Approved', 'Rejected', 'Completed'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: quote, error: quoteError } = await supabase.from('quotes').select('id, user_id, status, sub_token').eq('id', id).single();
  if (quoteError || !quote) return res.status(404).json({ error: 'Not found' });

  try {
    const form = formidable({ maxFileSize: 15 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    // Same access model as the timeline endpoint: contractor token, sub link token, or public customer link.
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    let allowed = false;
    if (authToken) {
      const { data: { user } } = await supabase.auth.getUser(authToken);
      if (user && user.id === quote.user_id) allowed = true;
    }
    const subToken = fields.token?.[0];
    if (!allowed && subToken && quote.sub_token && subToken === quote.sub_token) allowed = true;
    if (!allowed && PUBLIC_STATUSES.includes(quote.status)) allowed = true;
    if (!allowed) return res.status(403).json({ error: 'Not available' });

    const photoFile = files.file?.[0];
    if (!photoFile) return res.status(400).json({ error: 'No file provided' });

    const mimetype = photoFile.mimetype || 'image/jpeg';
    const ext = EXT_BY_MIME[mimetype] || 'jpg';
    const fileData = fs.readFileSync(photoFile.filepath);
    const path = `${quote.user_id}/${id}/timeline/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('quote-photos')
      .upload(path, fileData, { contentType: mimetype, upsert: false });

    fs.unlinkSync(photoFile.filepath);

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message || 'Upload failed.' });
    }

    const { data: pub } = supabase.storage.from('quote-photos').getPublicUrl(path);
    return res.status(200).json({ url: pub.publicUrl });
  } catch (e) {
    console.error('Timeline photo upload error:', e);
    return res.status(500).json({ error: e.message });
  }
}
