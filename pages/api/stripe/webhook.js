import { stripe } from '../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).json({ error: `Webhook error: ${e.message}` });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const getPlan = (priceId) => {
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
    if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return 'premium';
    return 'free';
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      if (session.metadata?.type === 'job_payment' && session.metadata?.quote_id) {
        // A customer just paid an approved estimate -- money went straight
        // to the contractor's connected Stripe account, this just records it.
        await supabase.from('quotes').update({
          paid_at: new Date().toISOString(),
          payment_amount: (session.amount_total || 0) / 100,
        }).eq('id', session.metadata.quote_id);
      } else if (userId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const plan = getPlan(sub.items.data[0]?.price?.id);
        await supabase.from('profiles').update({
          plan,
          plan_status: 'active',
          stripe_subscription_id: session.subscription,
          quotes_used_this_month: 0,
        }).eq('id', userId);
      }
      break;
    }
    case 'account.updated': {
      // A contractor's Connect onboarding status changed (e.g. they
      // finished adding their bank details).
      const account = event.data.object;
      await supabase.from('profiles').update({
        stripe_charges_enabled: !!account.charges_enabled,
        stripe_payouts_enabled: !!account.payouts_enabled,
      }).eq('stripe_account_id', account.id);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
      if (profile) {
        const plan = sub.status === 'active' ? getPlan(sub.items.data[0]?.price?.id) : 'free';
        await supabase.from('profiles').update({ plan, plan_status: sub.status }).eq('id', profile.id);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
      if (profile) {
        await supabase.from('profiles').update({ plan: 'free', plan_status: 'canceled', stripe_subscription_id: null }).eq('id', profile.id);
      }
      break;
    }
  }

  return res.status(200).json({ received: true });
}
