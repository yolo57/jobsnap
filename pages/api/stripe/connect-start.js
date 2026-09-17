import { stripe } from '../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Kicks off (or resumes) Stripe Connect onboarding so a contractor can
// receive customer job-payments directly to their own bank account.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile } = await supabase.from('profiles').select('stripe_account_id, email, company_name').eq('id', user.id).single();

  try {
    let accountId = profile?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile?.email || user.email,
        business_profile: profile?.company_name ? { name: profile.company_name } : undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe_refresh=1`,
      return_url: `${baseUrl}/settings?stripe_return=1`,
      type: 'account_onboarding',
    });

    return res.status(200).json({ url: link.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
