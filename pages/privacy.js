import Link from 'next/link';
import { JobSnapLogo } from '../components/ui';

const LAST_UPDATED = 'September 8, 2026';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: "'Sora', sans-serif" }}>{title}</h2>
    <div style={{ color: '#475569', fontSize: 15, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function Privacy() {
  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ marginBottom: 24 }}>
            <JobSnapLogo size={36} />
          </div>
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 36px' }}>Last updated: {LAST_UPDATED}</p>

        <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          JobSnap ("JobSnap," "we," "us," or "our") provides a mobile and web application that helps contractors
          record job walk-throughs and generate professional quotes for their customers. This Privacy Policy
          explains what information we collect, how we use it, who we share it with, and the choices you have.
          By using JobSnap, you agree to the practices described below. This policy is provided for transparency
          and does not constitute legal advice; if you have questions about your specific legal obligations, please
          consult an attorney.
        </p>

        <Section title="1. Information We Collect">
          <p style={{ margin: '0 0 10px' }}>We collect the following categories of information:</p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Account information.</strong> When you sign up, we collect your name, email address, and
            business details (such as company name, phone number, and logo) that you choose to add to your profile.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Customer data you enter.</strong> To generate quotes, you may enter your customers' names,
            phone numbers, email addresses, and job-site addresses.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Audio recordings and transcripts.</strong> When you record a job walk-through, we process
            that audio to create a text transcript and an AI-generated quote. Recordings are used to generate your
            estimate and are stored so you can review or re-generate a quote later.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Payment information.</strong> If you subscribe to a paid plan, payment is handled by our
            payment processor (Stripe). We do not receive or store your full card number.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Usage data.</strong> We may collect basic technical data such as device type, browser, IP
            address, and app usage events to keep the service reliable and to improve it.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p style={{ margin: '0 0 10px' }}>We use the information we collect to:</p>
          <p style={{ margin: '0 0 6px' }}>Provide, operate, and maintain the JobSnap service, including turning your recordings into transcripts and quotes.</p>
          <p style={{ margin: '0 0 6px' }}>Create and send quotes/estimates to the customers you specify, on your behalf.</p>
          <p style={{ margin: '0 0 6px' }}>Process subscription payments and manage your account and plan.</p>
          <p style={{ margin: '0 0 6px' }}>Send you service-related communications, such as account or billing notices.</p>
          <p style={{ margin: 0 }}>Monitor, troubleshoot, and improve the reliability and performance of the app.</p>
        </Section>

        <Section title="3. Third-Party Service Providers">
          <p style={{ margin: '0 0 10px' }}>
            We share information with a limited number of third-party providers who help us operate JobSnap. These
            providers are only permitted to use your information to provide services to us, not for their own
            purposes.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>OpenAI.</strong> Audio recordings and transcripts are sent to OpenAI's Whisper and GPT models
            to generate transcripts and draft quote language.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Supabase.</strong> We use Supabase to host our database, handle authentication, and store
            files (such as recordings and logos) securely.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Stripe.</strong> Subscription payments are processed by Stripe. Stripe's own privacy policy
            governs how it handles your payment details.
          </p>
          <p style={{ margin: 0 }}>
            We do not sell your personal information to third parties, and we do not share your customers' data
            for advertising purposes.
          </p>
        </Section>

        <Section title="4. Data Retention">
          <p style={{ margin: 0 }}>
            We retain your account information, customer records, recordings, and quotes for as long as your
            account is active, or as needed to provide the service to you. If you delete your account, we will
            delete or anonymize your personal data within a reasonable period, except where we are required to
            keep certain records (for example, billing records) for legal or accounting purposes.
          </p>
        </Section>

        <Section title="5. Your Rights and Choices">
          <p style={{ margin: '0 0 10px' }}>Depending on where you live, you may have the right to:</p>
          <p style={{ margin: '0 0 6px' }}>Access, correct, or delete the personal information we hold about you.</p>
          <p style={{ margin: '0 0 6px' }}>Export your data (such as your quotes and customer list).</p>
          <p style={{ margin: '0 0 6px' }}>Withdraw consent or object to certain processing.</p>
          <p style={{ margin: 0 }}>
            To exercise any of these rights, contact us using the details below. You can also update or delete
            most of your information directly from your account settings.
          </p>
        </Section>

        <Section title="6. Data Security">
          <p style={{ margin: 0 }}>
            We use industry-standard measures, including encryption in transit, to protect your information.
            No method of transmission or storage is 100% secure, and we cannot guarantee absolute security, but we
            work to protect your data and to promptly address any vulnerabilities.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p style={{ margin: 0 }}>
            JobSnap is intended for business use by contractors and is not directed at children. We do not
            knowingly collect personal information from anyone under 16. If you believe a child has provided us
            with personal information, please contact us and we will delete it.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p style={{ margin: 0 }}>
            We may update this Privacy Policy from time to time. If we make material changes, we will update the
            "Last updated" date above and, where appropriate, notify you directly. Continued use of JobSnap after
            changes take effect means you accept the updated policy.
          </p>
        </Section>

        <Section title="9. Contact Us">
          <p style={{ margin: 0 }}>
            If you have questions about this Privacy Policy or how we handle your information, please contact us
            at <a href="mailto:support@jobsnap-psi.vercel.app" style={{ color: '#2563eb' }}>support@jobsnap-psi.vercel.app</a>.
          </p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
          <Link href="/" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to JobSnap
          </Link>
        </div>
      </div>
    </div>
  );
}
