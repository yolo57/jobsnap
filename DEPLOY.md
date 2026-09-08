# JobSnap v2 — Deployment Guide

## What you need (all free to start)
- Vercel account (vercel.com)
- Supabase account (supabase.com)
- Stripe account (stripe.com)
- OpenAI account (platform.openai.com)

---

## STEP 1 — Set up Supabase (10 min)

1. Go to supabase.com → New Project
2. Give it a name → Set a database password → Create

3. Go to **SQL Editor** → **New Query**
4. Copy the entire contents of `supabase-schema.sql` and paste it → **Run**

5. Go to **Settings → API**
   - Copy **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## STEP 2 — Set up Stripe (10 min)

1. Go to dashboard.stripe.com
2. Go to **Products → Add Product**

   **Pro Plan:**
   - Name: Pro
   - Price: $79.00 / month (recurring)
   - Copy the Price ID → `STRIPE_PRO_PRICE_ID`

   **Premium Plan:**
   - Name: Premium
   - Price: $129.00 / month (recurring)
   - Copy the Price ID → `STRIPE_PREMIUM_PRICE_ID`

3. Go to **Developers → API Keys**
   - Copy **Secret key** → `STRIPE_SECRET_KEY`
   - Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

4. Go to **Developers → Webhooks → Add endpoint**
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## STEP 3 — Deploy to Vercel (5 min)

### Option A: Deploy from folder (what you're doing)

```
cd C:\Users\User\Desktop\jobsnap
npm install
npm run build
vercel --prod
```

When asked to link: create new project → name it `jobsnap`

### Option B: Deploy from GitHub (recommended for future)

Push to GitHub → Import at vercel.com/new

---

## STEP 4 — Add Environment Variables in Vercel

Go to vercel.com → jobsnap project → **Settings → Environment Variables**

Add ALL of these:

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks |
| `STRIPE_PRO_PRICE_ID` | Stripe → Products |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe → Products |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL e.g. https://jobsnap.vercel.app |
| `EMAIL_USER` | Gmail address for follow-ups |
| `EMAIL_PASS` | Gmail App Password (not your login password) |
| `EMAIL_FROM` | Same as EMAIL_USER |
| `CRON_SECRET` | Any random string e.g. "jobsnap-cron-2024" |

After adding all variables → click **Redeploy**

---

## STEP 5 — Enable Gmail App Password (for follow-ups)

1. Go to myaccount.google.com → Security
2. Enable **2-Step Verification** (required)
3. Search for **App Passwords**
4. Create one → name it "JobSnap" → Copy the 16-char password
5. Use this as `EMAIL_PASS` (NOT your Gmail login password)

---

## STEP 6 — Test everything

1. Go to your-app.vercel.app
2. Sign up with your email
3. Record a job → confirm AI generates estimate
4. Share quote link → confirm customer can view and approve
5. Test upgrade flow → use Stripe test card `4242 4242 4242 4242`

---

## App Store Wrapping (Median.co)

To get JobSnap on the iPhone App Store without a Mac:

1. Go to median.co
2. Enter your Vercel URL
3. Configure icon + splash screen
4. Download the app package
5. Submit to App Store (~$99/year Apple Developer account)

---

## Support

All data is stored in Supabase → you can view/manage it in the Supabase dashboard.
Stripe subscriptions managed at dashboard.stripe.com.
