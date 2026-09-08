import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false, responseLimit: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const form = formidable({ maxFileSize: 50 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const audioFile = files.file?.[0];
    if (!audioFile) return res.status(400).json({ error: 'No audio file provided' });

    const fileData = fs.readFileSync(audioFile.filepath);
    const mimeType = audioFile.mimetype || 'audio/webm';
    const blob = new Blob([fileData], { type: mimeType });

    // Trust the actual mime type over the client-supplied filename: iOS
    // records audio/mp4, and a mismatched .webm extension makes Whisper
    // reject the upload as an invalid file format.
    const extMap = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav' };
    const ext = extMap[mimeType.split(';')[0].trim()] || 'webm';

    const formData = new FormData();
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Transcription failed' });
    }

    const data = await response.json();
    if (audioFile.filepath) fs.unlinkSync(audioFile.filepath);
    return res.status(200).json({ text: data.text });
  } catch (e) {
    console.error('Transcribe error:', e);
    return res.status(500).json({ error: e.message });
  }
}