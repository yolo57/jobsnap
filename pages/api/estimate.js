export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'transcript is required' });

  // Whisper transcribes in whatever language the contractor spoke. Keep the
  // first draft of the estimate in that same language so the contractor can
  // review it naturally — translating it for the customer is a separate,
  // explicit step (see /api/quotes/[id]/translate) rather than something
  // guessed at generation time.
  const prompt = `You are a professional estimator for contractors. A contractor recorded a voice note at a job site.

Transcript: "${transcript}"

Generate a professional contractor estimate with detailed line items. Write every text field ("scope", "task", "desc") in the SAME language as the transcript above — do not translate it.

Respond ONLY with valid JSON, no markdown:
{
  "scope": "Brief 1-2 sentence summary of the job",
  "lineItems": [
    {
      "task": "Short task name",
      "desc": "Professional 1-2 sentence description of work included",
      "qty": 1,
      "unit": "ea",
      "price": 250
    }
  ]
}

Rules:
- Prices in USD with realistic market rates (labor + materials combined)
- Units: ea, hr, sqft, lnft, lot
- Be specific and professional — this goes directly to customers
- 2 to 12 line items
- Price must be a number only
- Match the transcript's language exactly, do not translate`;

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
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'AI generation failed' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(text);

    const lineItems = (parsed.lineItems || []).map((item, i) => ({
      id: `li_${Date.now()}_${i}`,
      task: item.task,
      desc: item.desc,
      qty: Number(item.qty) || 1,
      unit: item.unit || 'ea',
      price: Number(item.price) || 0,
    }));

    return res.status(200).json({ lineItems, scope: parsed.scope });
  } catch (e) {
    console.error('Estimate error:', e);
    return res.status(500).json({ error: e.message });
  }
}
