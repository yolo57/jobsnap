import formidable from 'formidable';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
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
    const form = formidable({ maxFileSize: 3 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const logoFile = files.file?.[0];
    if (!logoFile) return res.status(400).json({ error: 'No file provided' });

    const mimetype = logoFile.mimetype || 'image/png';
    const ext = EXT_BY_MIME[mimetype] || 'png';
    const fileData = fs.readFileSync(logoFile.filepath);
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, fileData, { contentType: mimetype, upsert: true });

    fs.unlinkSync(logoFile.filepath);

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message || 'Upload failed. Does the "logos" bucket exist in Supabase Storage?' });
    }

    const { data: pub } = supabase.storage.from('logos').getPublicUrl(path);
    // Cache-bust so the browser picks up a changed logo immediately.
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    return res.status(200).json({ url });
  } catch (e) {
    console.error('Logo upload error:', e);
    return res.status(500).json({ error: e.message });
  }
}
