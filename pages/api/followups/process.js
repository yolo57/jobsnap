// Called by Vercel Cron Job daily
// Add to vercel.json: { "crons": [{ "path": "/api/followups/process", "schedule": "0 10 * * *" }] }

import { createClient } from '@supabase/supabase-js';
import { sendFollowUpEmail } from '../../../lib/email';

export default async function handler(req, res) {
  // Verify this is called by Vercel cron or internally
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const results = { processed: 0, sent: 0, errors: [] };

  try {
    // Get all sent (not yet approved/rejected) quotes with followups enabled
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*, profiles(company_name, owner_name, phone, email, plan, followups_enabled)')
      .eq('status', 'Sent')
      .eq('followup_enabled', true)
      .not('sent_at', 'is', null);

    for (const quote of quotes || []) {
      const profile = quote.profiles;
      if (!profile || profile.plan !== 'premium' || !profile.followups_enabled) continue;
      if (!quote.customer_email) continue;

      const sentAt = new Date(quote.sent_at);
      const daysSinceSent = Math.floor((now - sentAt) / (1000 * 60 * 60 * 24));
      const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quote/${quote.id}`;

      results.processed++;

      // 24-hour follow-up
      if (daysSinceSent >= 1 && !quote.followup_sent_24h) {
        try {
          await sendFollowUpEmail({
            to: quote.customer_email,
            customerName: quote.customer_name || 'there',
            contractorName: profile.owner_name || profile.company_name,
            companyName: profile.company_name,
            quoteNumber: quote.number,
            quoteTotal: quote.total,
            quoteUrl,
            daysSinceSent: 1,
            replyTo: profile.email,
          });
          await supabase.from('quotes').update({ followup_sent_24h: true }).eq('id', quote.id);
          results.sent++;
        } catch (e) { results.errors.push(`${quote.id}: ${e.message}`); }
      }

      // 3-day follow-up
      else if (daysSinceSent >= 3 && !quote.followup_sent_3d) {
        try {
          await sendFollowUpEmail({
            to: quote.customer_email,
            customerName: quote.customer_name || 'there',
            contractorName: profile.owner_name || profile.company_name,
            companyName: profile.company_name,
            quoteNumber: quote.number,
            quoteTotal: quote.total,
            quoteUrl,
            daysSinceSent: 3,
            replyTo: profile.email,
          });
          await supabase.from('quotes').update({ followup_sent_3d: true }).eq('id', quote.id);
          results.sent++;
        } catch (e) { results.errors.push(`${quote.id}: ${e.message}`); }
      }

      // 7-day follow-up
      else if (daysSinceSent >= 7 && !quote.followup_sent_7d) {
        try {
          await sendFollowUpEmail({
            to: quote.customer_email,
            customerName: quote.customer_name || 'there',
            contractorName: profile.owner_name || profile.company_name,
            companyName: profile.company_name,
            quoteNumber: quote.number,
            quoteTotal: quote.total,
            quoteUrl,
            daysSinceSent: 7,
            replyTo: profile.email,
          });
          await supabase.from('quotes').update({ followup_sent_7d: true }).eq('id', quote.id);
          results.sent++;
        } catch (e) { results.errors.push(`${quote.id}: ${e.message}`); }
      }
    }

    return res.status(200).json({ success: true, ...results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
