import { createClient } from '@supabase/supabase-js';
import { sendTimelineMessageEmail } from '../../../../lib/email';

const PUBLIC_STATUSES = ['Sent', 'Approved', 'Rejected', 'Completed'];

export default async function handler(req, res) {
  const { id } = req.query;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, user_id, status, customer_name, customer_email, sub_token, profiles(company_name, owner_name, email)')
    .eq('id', id)
    .single();
  if (quoteError || !quote) return res.status(404).json({ error: 'Not found' });

  // Figure out who's asking: contractor (auth token), sub (?t= token), or customer (no auth, public link).
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  let callerRole = null;
  if (authToken) {
    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (user && user.id === quote.user_id) callerRole = 'contractor';
  }
  if (!callerRole && req.query.t && quote.sub_token && req.query.t === quote.sub_token) callerRole = 'sub';
  if (!callerRole && req.body?.token && quote.sub_token && req.body.token === quote.sub_token) callerRole = 'sub';
  if (!callerRole && PUBLIC_STATUSES.includes(quote.status)) callerRole = 'customer';

  if (!callerRole) return res.status(403).json({ error: 'Not available' });

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('job_updates').select('*').eq('quote_id', id).order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { message, photos, authorName, entryType } = req.body || {};
    if (!message && (!photos || photos.length === 0)) return res.status(400).json({ error: 'Empty update' });

    const role = callerRole;
    const defaultName = role === 'contractor' ? (quote.profiles?.owner_name || quote.profiles?.company_name) : role === 'customer' ? (quote.customer_name || 'Customer') : 'Crew';

    const { data, error } = await supabase.from('job_updates').insert({
      quote_id: id,
      entry_type: entryType === 'message' ? 'message' : 'update',
      role,
      author_name: authorName || defaultName,
      message: message || null,
      photos: photos || [],
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // Chat messages ping the other side by email — routine progress updates stay quiet.
    if (data.entry_type === 'message' && message) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const companyName = quote.profiles?.company_name || 'Your contractor';
        if (role === 'customer' && quote.profiles?.email) {
          await sendTimelineMessageEmail({
            to: quote.profiles.email,
            recipientName: quote.profiles.owner_name || companyName,
            senderName: data.author_name,
            companyName,
            messageText: message,
            jobUrl: `${baseUrl}/quotes/${id}`,
          });
        } else if ((role === 'contractor' || role === 'sub') && quote.customer_email) {
          await sendTimelineMessageEmail({
            to: quote.customer_email,
            recipientName: quote.customer_name || 'there',
            senderName: data.author_name,
            companyName,
            messageText: message,
            jobUrl: `${baseUrl}/quote/${id}`,
            replyTo: quote.profiles?.email,
          });
        }
      } catch (e) {
        console.error('Timeline notification email failed:', e.message);
      }
    }

    return res.status(200).json(data);
  }

  return res.status(405).end();
}
