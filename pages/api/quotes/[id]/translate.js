import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;
  const { targetLanguage } = req.body; // 'en' | 'es'
  if (!['en', 'es'].includes(targetLanguage)) return res.status(400).json({ error: 'targetLanguage must be "en" or "es"' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: quote, error: fetchError } = await supabase.from('quotes').select('*').eq('id', id).eq('user_id', user.id).single();
  if (fetchError || !quote) return res.status(404).json({ error: 'Not found' });

  const targetName = targetLanguage === 'es' ? 'Spanish' : 'English';

  const prompt = `Translate the following contractor estimate content into ${targetName}. Keep numbers, quantities and units exactly as they are — only translate the text.

Respond ONLY with valid JSON, no markdown, matching this exact shape:
{
  "lineItems": [
    { "task": "...", "desc": "..." }
  ],
  "notes": "..."
}

Line items (translate "task" and "desc" for each, keep the same order and count — ${quote.line_items.length} items):
${JSON.stringify((quote.line_items || []).map(i => ({ task: i.task, desc: i.desc })))}

Notes field to translate (may be empty):
${JSON.stringify(quote.notes || '')}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Translation failed' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);

    const translatedItems = (quote.line_items || []).map((item, i) => ({
      ...item,
      task: parsed.lineItems?.[i]?.task || item.task,
      desc: parsed.lineItems?.[i]?.desc ?? item.desc,
    }));

    const { data: updated, error: updateError } = await supabase.from('quotes').update({
      line_items: translatedItems,
      notes: parsed.notes ?? quote.notes,
      language: targetLanguage,
    }).eq('id', id).eq('user_id', user.id).select().single();

    if (updateError) return res.status(500).json({ error: updateError.message });
    return res.status(200).json(updated);
  } catch (e) {
    console.error('Translate error:', e);
    return res.status(500).json({ error: e.message });
  }
}
