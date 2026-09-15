import { createClient } from '@supabase/supabase-js';
import { sendReviewRequestEmail, sendScheduleEmail } from '../../../lib/email';

export default async function handler(req, res) {
  const { id } = req.query;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Public GET for shareable quote page
  if (req.method === 'GET' && !req.headers.authorization) {
    const { data, error } = await supabase.from('quotes').select('*, profiles(company_name, phone, email, logo_url, owner_name, license_number, payment_terms, quote_notes)').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Quote not found' });
    if (!['Sent', 'Approved', 'Rejected', 'Completed'].includes(data.status)) return res.status(403).json({ error: 'Not available' });
    return res.status(200).json(data);
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  // GET single quote (authenticated)
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('quotes').select('*').eq('id', id).eq('user_id', user.id).single();
    if (error) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(data);
  }

  // PATCH - update quote
  if (req.method === 'PATCH') {
    const updates = req.body;
    // Recalculate totals if line items, tax, or discount changed
    const touchesTotals = updates.line_items || updates.tax_type !== undefined || updates.tax_value !== undefined || updates.discount_type !== undefined || updates.discount_value !== undefined;
    if (touchesTotals) {
      const { data: existing } = await supabase.from('quotes').select('line_items, tax_type, tax_value, discount_type, discount_value').eq('id', id).single();
      const items = updates.line_items || existing?.line_items || [];
      const subtotal = items.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
      const taxableSubtotal = items.filter(i => i.taxable).reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
      const taxType = updates.tax_type ?? existing?.tax_type ?? 'percent';
      const taxVal = Number(updates.tax_value ?? existing?.tax_value ?? 0) || 0;
      // No items marked taxable -> no tax, regardless of the rate entered.
      const tax_amount = taxableSubtotal <= 0 ? 0 : (taxType === 'percent' ? taxableSubtotal * (taxVal / 100) : taxVal);
      const discountType = updates.discount_type ?? existing?.discount_type ?? 'flat';
      const discountVal = Number(updates.discount_value ?? existing?.discount_value ?? 0) || 0;
      const rawDiscount = discountType === 'percent' ? subtotal * (discountVal / 100) : discountVal;
      const discountAmt = Math.min(Math.max(rawDiscount, 0), subtotal + tax_amount);

      updates.subtotal = subtotal;
      updates.tax_type = taxType;
      updates.tax_value = taxVal;
      updates.tax_rate = taxType === 'percent' ? taxVal : 0;
      updates.tax_amount = tax_amount;
      updates.discount_type = discountType;
      updates.discount_value = discountVal;
      updates.discount_amount = discountAmt;
      updates.total = subtotal + tax_amount - discountAmt;
    }
    if (updates.status === 'Sent' && !updates.sent_at) updates.sent_at = new Date().toISOString();
    if (updates.status === 'Approved') updates.approved_at = new Date().toISOString();
    if (updates.status === 'Completed') updates.completed_at = new Date().toISOString();

    const { data, error } = await supabase.from('quotes').update(updates).eq('id', id).eq('user_id', user.id).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // Job just marked complete — fire off a review request to the customer, if a review link is set.
    if (updates.status === 'Completed' && data.customer_email) {
      try {
        const { data: profile } = await supabase.from('profiles').select('company_name, owner_name, email, review_link').eq('id', user.id).single();
        if (profile?.review_link) {
          await sendReviewRequestEmail({
            to: data.customer_email,
            customerName: data.customer_name || 'there',
            contractorName: profile.owner_name || profile.company_name,
            companyName: profile.company_name,
            reviewLink: profile.review_link,
            replyTo: profile.email,
          });
          await supabase.from('quotes').update({ review_requested_at: new Date().toISOString() }).eq('id', id);
        }
      } catch (e) {
        // Don't fail the status update if the email fails — just log it.
        console.error('Review request email failed:', e.message);
      }
    }

    // Job just got a scheduled date — let the customer know.
    if (updates.scheduled_date && data.customer_email) {
      try {
        const { data: profile } = await supabase.from('profiles').select('company_name, owner_name, email').eq('id', user.id).single();
        await sendScheduleEmail({
          to: data.customer_email,
          customerName: data.customer_name || 'there',
          contractorName: profile?.owner_name || profile?.company_name,
          companyName: profile?.company_name,
          scheduledDate: data.scheduled_date,
          scheduledTime: data.scheduled_time,
          address: data.address,
          quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quote/${data.id}`,
          replyTo: profile?.email,
        });
        await supabase.from('quotes').update({ schedule_notified_at: new Date().toISOString() }).eq('id', id);
      } catch (e) {
        // Don't fail the schedule save if the email fails — just log it.
        console.error('Schedule notification email failed:', e.message);
      }
    }

    return res.status(200).json(data);
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('quotes').delete().eq('id', id).eq('user_id', user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
