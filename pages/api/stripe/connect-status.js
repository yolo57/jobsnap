import { stripe } from '../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Live-checks the contractor's Stripe Connect account so Settings can show
// an up-to-date badge right after they return from onboarding, without
// waiting on the account.updated webhook.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile } = await supabase.from('profiles').select('stripe_account_id').eq('id', user.id).single();
  if (!profile?.stripe_account_id) return res.status(200).json({ connected: false });

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    await supabase.from('profiles').update({
      stripe_charges_enabled: !!account.charges_enabled,
      stripe_payouts_enabled: !!account.payouts_enabled,
    }).eq('id', user.id);

    return res.status(200).json({
      connected: true,
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      details_submitted: !!account.details_submitted,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
