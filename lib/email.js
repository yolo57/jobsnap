import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendFollowUpEmail({ to, customerName, contractorName, companyName, quoteNumber, quoteTotal, quoteUrl, daysSinceSent, replyTo }) {
  const subject = `Quick follow-up on your estimate #${quoteNumber} — ${companyName}`;

  const messages = {
    1: `Hi ${customerName},\n\nJust wanted to make sure you received estimate #${quoteNumber} for $${quoteTotal?.toLocaleString()}.\n\nFeel free to review it and let me know if you have any questions — I'm happy to adjust anything.\n\nView your estimate here:\n${quoteUrl}\n\nBest,\n${contractorName}\n${companyName}`,
    3: `Hi ${customerName},\n\nFollowing up on the estimate I sent a few days ago (#${quoteNumber}, $${quoteTotal?.toLocaleString()}).\n\nI'd love to get started on your project — just click the link below to approve or let me know if you'd like to discuss anything.\n\nView estimate: ${quoteUrl}\n\nBest,\n${contractorName}\n${companyName}`,
    7: `Hi ${customerName},\n\nI wanted to reach out one more time about estimate #${quoteNumber}. The quote is still available at the link below if you'd like to review it.\n\nIf the timing isn't right or you've gone in a different direction, no worries at all — just let me know.\n\n${quoteUrl}\n\nBest,\n${contractorName}\n${companyName}`,
  };

  const text = messages[daysSinceSent] || messages[1];

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="margin-bottom: 28px;">
        <span style="font-size: 22px; font-weight: 900; color: #1e3a5f; letter-spacing: -0.5px;">
          ${companyName}
        </span>
      </div>
      
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Hi ${customerName},</p>
      
      ${daysSinceSent === 1 ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Just wanted to make sure you received your estimate. Please take a look when you get a chance!</p>` : ''}
      ${daysSinceSent === 3 ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Following up on the estimate I sent a few days ago. I'd love to get started on your project!</p>` : ''}
      ${daysSinceSent === 7 ? `<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">One last follow-up on your estimate. If the timing isn't right, no worries at all.</p>` : ''}
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #2563eb;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; font-weight: 700;">Estimate</p>
        <p style="color: #1e293b; font-size: 20px; font-weight: 900; margin: 0 0 4px;">#${quoteNumber}</p>
        <p style="color: #2563eb; font-size: 22px; font-weight: 900; margin: 0;">$${quoteTotal?.toLocaleString()}</p>
      </div>
      
      <a href="${quoteUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 8px 0 24px;">
        View & Approve Estimate →
      </a>
      
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
        Questions? Reply to this email or call us directly.<br>
        <strong style="color: #374151;">${contractorName} · ${companyName}</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
      <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
        You're receiving this because a contractor sent you an estimate via JobSnap.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${companyName}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    replyTo: replyTo || undefined,
    to,
    subject,
    text,
    html,
  });
}
