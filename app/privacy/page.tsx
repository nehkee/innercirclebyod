import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { BRAND } from '@/lib/brand';
import { RETENTION } from '@/lib/support/config';

export const metadata = {
  title:       'Privacy Policy | Inner Circle',
  description: 'What Inner Circle collects, why, who it is shared with, and your rights.',
};

const L = BRAND.legal;

export default function PrivacyPage() {
  return (
    <LegalPage
      label="WHAT WE KNOW, AND WHY"
      title="PRIVACY"
      intro={
        <>
          <p>
            {L.entity} (&ldquo;we&rdquo;) runs Inner Circle. The circle runs on trust, and that includes how we treat
            your information. This policy explains what we collect, why, who helps us process it, and the rights you have.
          </p>
          <p>
            We aim to comply with the Nigeria Data Protection Act 2023, the UK GDPR and EU GDPR, and other laws that
            apply where our members live.
          </p>
        </>
      }
      sections={[
        {
          title: 'What we collect',
          body: (
            <ul>
              <li><strong>Account details</strong>: your name, email address, username and, if you add them, country and phone number.</li>
              <li><strong>Membership and purchases</strong>: your tier, renewal dates, tickets, drops, discounts and refund requests. Card, bank and wallet details are entered directly with our payment providers. We never see or store your full card number.</li>
              <li><strong>Conversations</strong>: messages you send the concierge chat and applications you submit for experiences.</li>
              <li><strong>Waitlist and invites</strong>: the name and email you give us, and invite codes you send or redeem.</li>
              <li><strong>Event entry</strong>: when your ticket QR code is scanned at the door.</li>
              <li><strong>Usage</strong>: pages visited and basic device information, collected without advertising trackers.</li>
            </ul>
          ),
        },
        {
          title: 'Why we use it',
          body: (
            <>
              <ul>
                <li><strong>To provide the membership</strong> you signed up for: accounts, payments, tickets, entry, perks and support. This is necessary to perform our contract with you.</li>
                <li><strong>To keep the circle safe</strong>: preventing fraud, ticket touting and abuse. This is our legitimate interest.</li>
                <li><strong>To talk to you</strong>: ticket confirmations, renewal and payment notices, and (if you opt in) WhatsApp updates about drops and events. You can switch WhatsApp updates off on your account page at any time.</li>
                <li><strong>To improve the service</strong>: understanding which pages and features work, using aggregated statistics.</li>
                <li><strong>To meet legal obligations</strong>, such as tax and accounting records.</li>
              </ul>
              <p>We do not sell your personal data, and we do not use it for third-party advertising.</p>
            </>
          ),
        },
        {
          title: 'Who we share it with',
          body: (
            <>
              <p>We use trusted providers that process data on our behalf, under contract:</p>
              <ul>
                <li><strong>Clerk</strong>: sign-in and account security.</li>
                <li><strong>Supabase</strong>: our database.</li>
                <li><strong>Vercel</strong>: website hosting and privacy-friendly analytics.</li>
                <li><strong>Stripe</strong>, <strong>Paystack</strong> and <strong>NOWPayments</strong>: card, naira and crypto payments.</li>
                <li><strong>Resend</strong>: transactional email.</li>
                <li><strong>Meta (WhatsApp Business)</strong>: only if you opt in to WhatsApp updates.</li>
              </ul>
              <p>We may also disclose information if required by law, or to protect members, staff or the public.</p>
            </>
          ),
        },
        {
          title: 'International transfers',
          body: (
            <p>
              Some providers store or process data outside your country (for example in the EU, UK or US). Where that
              happens we rely on appropriate safeguards such as standard contractual clauses or adequacy decisions.
            </p>
          ),
        },
        {
          title: 'How long we keep it',
          body: (
            <ul>
              <li>Account and membership data: while your account is open, then up to 24 months for disputes and record-keeping.</li>
              <li>Payment and refund records: as long as tax and accounting law requires (typically 6 years).</li>
              <li>Support conversations: up to 24 months after they close.</li>
              <li>Waitlist entries: until you join, ask us to remove you, or 24 months, whichever comes first.</li>
            </ul>
          ),
        },
        {
          title: 'Your rights',
          body: (
            <>
              <p>
                You can ask to access, correct, export or delete your data, object to or restrict certain uses, and
                withdraw consent at any time. Email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> and
                we&apos;ll respond within 30 days.
              </p>
              <p>
                If you&apos;re unhappy with our response you can complain to your data protection authority, such as the
                Nigeria Data Protection Commission or the UK Information Commissioner&apos;s Office.
              </p>
            </>
          ),
        },
        {
          title: 'Cookies',
          body: (
            <p>
              We use essential cookies to keep you signed in and to secure checkout. Analytics are cookieless and
              aggregated. We don&apos;t use advertising cookies.
            </p>
          ),
        },
        {
          title: 'Security',
          body: (
            <p>
              Data is encrypted in transit, access to member records is restricted to the team, ticket codes are
              cryptographically signed, and payments are handled by PCI-compliant providers. No system is perfectly
              secure, and we&apos;ll tell you promptly if a breach affects you.
            </p>
          ),
        },
        {
          title: 'Age',
          body: <p>Inner Circle is for people aged 18 and over. We don&apos;t knowingly collect data from children.</p>,
        },
        {
          title: 'Changes',
          body: (
            <p>
              We&apos;ll update this page when our practices change and tell members about significant changes by email.
              See also our <Link href="/terms">Terms</Link> and <Link href="/refunds">Refund Policy</Link> (approved
              refunds within {RETENTION.refundDays} days).
            </p>
          ),
        },
      ]}
    />
  );
}
