import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    quotesPerMonth: 3,
    features: ['3 quotes/month', 'AI estimates', 'PDF export', 'Basic branding'],
  },
  pro: {
    name: 'Pro',
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    quotesPerMonth: Infinity,
    features: ['Unlimited quotes', 'Full branding', 'PDF export', 'Shareable links', 'Customer CRM'],
  },
  premium: {
    name: 'Premium',
    price: 129,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    quotesPerMonth: Infinity,
    features: ['Everything in Pro', 'Automated follow-ups', 'Email reminders', 'Priority support'],
  },
};

export function canCreateQuote(profile) {
  if (profile.plan === 'pro' || profile.plan === 'premium') return true;
  return (profile.quotes_used_this_month || 0) < 3;
}

export function quotesRemaining(profile) {
  if (profile.plan === 'pro' || profile.plan === 'premium') return Infinity;
  return Math.max(0, 3 - (profile.quotes_used_this_month || 0));
}
