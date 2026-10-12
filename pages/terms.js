import Link from 'next/link';
import { JobSnapLogo } from '../components/ui';

const LAST_UPDATED = 'October 11, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: "'Sora', sans-serif" }}>{title}</h2>
    <div style={{ color: '#475569', fontSize: 15, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function Terms() {
  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ marginBottom: 24 }}>
            <JobSnapLogo size={36} />
          </div>
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" }}>
          Terms of Service
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 36px' }}>Last updated: {LAST_UPDATED}</p>

        <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          These Terms of Service ("Terms") govern your access to and use of JobSnap, a mobile and web application
          operated by Derch Enterprises LLC ("JobSnap," "we," "us," or "our") that helps contractors record job
          walk-throughs and generate professional quotes for their customers. By creating an account or using
          JobSnap, you agree to these Terms. If you do not agree, do not use the service.
        </p>

        <Section title="1. Who Can Use JobSnap">
          <p style={{ margin: 0 }}>
            JobSnap is intended for business use by contractors and service providers who are at least 18 years
            old. By using JobSnap you confirm you meet this requirement and that the information you provide about
            yourself and your business is accurate.
          </p>
        </Section>

        <Section title="2. Your Account">
          <p style={{ margin: 0 }}>
            You're responsible for keeping your login credentials secure and for all activity that happens under
            your account. Let us know right away at the contact below if you suspect unauthorized use.
          </p>
        </Section>

        <Section title="3. Subscription Plans and Payment">
          <p style={{ margin: '0 0 10px' }}>
            JobSnap offers a free plan with limited monthly quotes, and paid Pro and Premium subscription plans
            with additional features. Current pricing is listed on our <Link href="/pricing" style={{ color: '#2563eb' }}>Pricing</Link> page.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            Paid subscriptions are billed in advance on a recurring (monthly) basis through our payment processor.
            Subscriptions renew automatically until you cancel. You can cancel at any time from your account
            settings; cancellation stops future billing but does not refund the current billing period except as
            described in our <Link href="/refund-policy" style={{ color: '#2563eb' }}>Refund Policy</Link>.
          </p>
          <p style={{ margin: 0 }}>
            We may change our prices from time to time. If we do, we'll give you reasonable notice before the
            change applies to your next billing cycle.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p style={{ margin: '0 0 10px' }}>You agree not to use JobSnap to:</p>
          <p style={{ margin: '0 0 6px' }}>Violate any applicable law or the rights of any third party.</p>
          <p style={{ margin: '0 0 6px' }}>Upload content you don't have the right to share, or that is fraudulent, deceptive, or harmful.</p>
          <p style={{ margin: '0 0 6px' }}>Attempt to interfere with, disrupt, or reverse-engineer the service.</p>
          <p style={{ margin: 0 }}>Resell or redistribute the service without our written permission.</p>
        </Section>

        <Section title="5. Your Content">
          <p style={{ margin: 0 }}>
            You keep ownership of the recordings, quotes, and customer information you add to JobSnap. You grant
            us a limited license to process and store that content solely to provide and improve the service, as
            described in our <Link href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</Link>. You're
            responsible for having the right to collect and share any customer information you enter.
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p style={{ margin: 0 }}>
            JobSnap relies on third-party providers (such as OpenAI for transcription and quote drafting, Supabase
            for hosting, and a payment processor for billing) to operate. We aren't responsible for outages or
            issues caused by those providers, though we'll work to minimize any impact on you.
          </p>
        </Section>

        <Section title="7. Disclaimers">
          <p style={{ margin: 0 }}>
            JobSnap is provided "as is" without warranties of any kind. AI-generated estimates are a starting
            point, not a guarantee of accuracy — you're responsible for reviewing and confirming any quote before
            sending it to a customer. We don't guarantee the service will be uninterrupted or error-free.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p style={{ margin: 0 }}>
            To the fullest extent permitted by law, Derch Enterprises LLC will not be liable for any indirect,
            incidental, or consequential damages arising from your use of JobSnap. Our total liability for any
            claim relating to the service is limited to the amount you paid us in the 3 months before the claim
            arose.
          </p>
        </Section>

        <Section title="9. Termination">
          <p style={{ margin: 0 }}>
            You may stop using JobSnap and cancel your account at any time. We may suspend or terminate accounts
            that violate these Terms or that we reasonably believe are being used fraudulently or abusively.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p style={{ margin: 0 }}>
            We may update these Terms from time to time. If we make material changes, we'll update the "Last
            updated" date above and, where appropriate, notify you directly. Continued use of JobSnap after
            changes take effect means you accept the updated Terms.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p style={{ margin: 0 }}>
            Questions about these Terms? Contact us at{' '}
            <a href="mailto:support@jobsnap-psi.vercel.app" style={{ color: '#2563eb' }}>support@jobsnap-psi.vercel.app</a>.
          </p>
        </Section>

        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
          This document is provided for transparency and does not constitute legal advice. If you have specific
          legal questions about these Terms, please consult an attorney.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
          <Link href="/" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to JobSnap
          </Link>
        </div>
      </div>
    </div>
  );
}
