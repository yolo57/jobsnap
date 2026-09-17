import { stripe, platformFeeCents } from '../../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Public endpoint: the customer taps "Pay Now" on their quote page.
// Creates a Stripe Checkout session that pays the contractor's own
// connected account directly, minus JobSnap's small platform fee.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, profiles(company_name, stripe_account_id, stripe_charges_enabled)')
    .eq('id', id)
    .single();

  if (error || !quote) return res.status(404).json({ error: 'Quote not found' });
  if (!['Approved', 'Completed'].includes(quote.status)) return res.status(400).json({ error: 'This estimate is not ready for payment yet.' });
  if (quote.paid_at) return res.status(400).json({ error: 'This estimate has already been paid.' });

  const profile = quote.profiles || {};
  if (!profile.stripe_account_id || !profile.stripe_charges_enabled) {
    return res.status(400).json({ error: 'This contractor has not set up online payments yet.' });
  }

  const amountCents = Math.round((quote.total || 0) * 100);
  if (amountCents <= 0) return res.status(400).json({ error: 'Invalid amount.' });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Estimate #${quote.number} — ${profile.company_name || 'JobSnap'}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: platformFeeCents(amountCents),
        transfer_data: { destination: profile.stripe_account_id },
      },
      success_url: `${baseUrl}/quote/${quote.id}?paid=1`,
      cancel_url: `${baseUrl}/quote/${quote.id}`,
      metadata: { type: 'job_payment', quote_id: quote.id },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
