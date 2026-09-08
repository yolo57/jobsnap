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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const form = formidable({ maxFileSize: 8 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);
    const photoFile = files.file?.[0];
    const quoteId = fields.quote_id?.[0];
    if (!photoFile) return res.status(400).json({ error: 'No file provided' });
    if (!quoteId) return res.status(400).json({ error: 'Missing quote_id' });

    // Confirm this quote belongs to the requesting user before writing to storage.
    const { data: quote, error: quoteError } = await supabase.from('quotes').select('id').eq('id', quoteId).eq('user_id', user.id).single();
    if (quoteError || !quote) return res.status(403).json({ error: 'Quote not found' });

    const mimetype = photoFile.mimetype || 'image/jpeg';
    const ext = EXT_BY_MIME[mimetype] || 'jpg';
    const fileData = fs.readFileSync(photoFile.filepath);
    const path = `${user.id}/${quoteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('quote-photos')
      .upload(path, fileData, { contentType: mimetype, upsert: false });

    fs.unlinkSync(photoFile.filepath);

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message || 'Upload failed. Does the "quote-photos" bucket exist in Supabase Storage?' });
    }

    const { data: pub } = supabase.storage.from('quote-photos').getPublicUrl(path);
    return res.status(200).json({ url: pub.publicUrl });
  } catch (e) {
    console.error('Quote photo upload error:', e);
    return res.status(500).json({ error: e.message });
  }
}
