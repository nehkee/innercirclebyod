import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalPage';
import { BRAND } from '@/lib/brand';
import { RETENTION } from '@/lib/support/config';

export const metadata = {
  title:       'Terms of Use | Inner Circle',
  description: 'The rules of the circle: membership, payments, events, conduct and refunds.',
};

const L = BRAND.legal;

export default function TermsPage() {
  return (
    <LegalPage
      label="THE RULES OF THE CIRCLE"
      title="TERMS"
      intro={
        <p>
          These terms are an agreement between you and {L.entity} for your use of Inner Circle: the website, membership,
          events, drops and everything that comes with them. By creating an account or making a purchase you agree to
          them. Please read them. They&apos;re written to be readable.
        </p>
      }
      sections={[
        {
          title: 'Membership',
          body: (
            <ul>
              <li>You must be 18 or over and give accurate details. One account per person.</li>
              <li>Membership is personal. Don&apos;t share your account or sell access to it.</li>
              <li>Some tiers, events and drops are invitation-only or limited. Being a member doesn&apos;t guarantee a place.</li>
              <li>We may change tier benefits from time to time. If a change materially reduces what you&apos;ve paid for, we&apos;ll tell you first and you can cancel.</li>
            </ul>
          ),
        },
        {
          title: 'Payments and renewal',
          body: (
            <ul>
              <li><strong>Card memberships</strong> renew monthly until you cancel. We&apos;ll charge the card on file at the start of each period.</li>
              <li><strong>Paystack and crypto memberships</strong> are 30-day passes and do not renew automatically.</li>
              <li>Prices are shown before you pay, including currency. Crypto prices are fixed in US dollars and converted at checkout by NOWPayments.</li>
              <li>If a renewal payment fails, your access may pause until you update your card on your <Link href="/account">account page</Link>.</li>
            </ul>
          ),
        },
        {
          title: 'Cancelling',
          body: (
            <p>
              You can cancel a card membership at any time from your account. You keep access until the end of the period
              you&apos;ve paid for, and you won&apos;t be charged again. We may offer you alternatives first, such as a pause,
              a discount or a different date, but you can always choose to cancel.
            </p>
          ),
        },
        {
          title: 'Refunds',
          body: (
            <p>
              If you can&apos;t make an event, we&apos;ll first try to move your ticket to another date, let you transfer it,
              or offer a discount. If you still want your money back, request a refund through the concierge chat and
              approved refunds are processed within {RETENTION.refundDays} days to your original payment method. Events
              that have already taken place are not refundable. Full details: <Link href="/refunds">Refund Policy</Link>.
            </p>
          ),
        },
        {
          title: 'Tickets and entry',
          body: (
            <ul>
              <li>Each ticket has a unique, signed QR code. It&apos;s valid once. Screenshots shared with others will be refused after the first scan.</li>
              <li>You may transfer a ticket to another member through the concierge. Reselling tickets outside the site is not allowed and may lead to cancellation without refund.</li>
              <li>Secret locations are revealed to ticket holders before the event. Please keep them private.</li>
              <li>Events may be rescheduled. If a date changes, your ticket moves with it, or you can request a refund.</li>
              <li>Venues and our team may refuse entry or remove anyone for safety reasons or for breaking these rules.</li>
            </ul>
          ),
        },
        {
          title: 'The code',
          body: (
            <>
              <p>What happens in the circle stays in the circle. By joining you agree to:</p>
              <ul>
                <li>Respect &ldquo;no phones&rdquo; and &ldquo;no recording&rdquo; rules at events, and not leak unreleased music, previews or private content.</li>
                <li>Treat other members, artists and staff with respect. No harassment, hate or threats, online or in person.</li>
                <li>Not attempt to hack, scrape, abuse offers, or get around access controls.</li>
              </ul>
              <p>Breaking the code may lead to suspension or permanent removal. Where removal is for a serious breach, unused fees may not be refunded.</p>
            </>
          ),
        },
        {
          title: 'Content and intellectual property',
          body: (
            <p>
              Music, previews, images, video and other content shared with members are licensed to you for personal,
              private enjoyment only. They remain the property of their owners. You may not copy, publish, distribute
              or sell them.
            </p>
          ),
        },
        {
          title: 'Liability',
          body: (
            <p>
              We work hard to deliver everything we promise, but the service is provided as it is. To the extent the law
              allows, we&apos;re not liable for indirect or consequential losses, and our total liability to you is limited
              to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that
              can&apos;t be limited by law, or your statutory consumer rights.
            </p>
          ),
        },
        {
          title: 'Changes and termination',
          body: (
            <p>
              We may update these terms and will notify members of significant changes. You can close your account at any
              time. We may suspend or close accounts that break these terms.
            </p>
          ),
        },
        {
          title: 'Governing law',
          body: (
            <p>
              These terms are governed by the laws of {L.jurisdiction}. If you live elsewhere, you also keep the protection
              of mandatory consumer laws where you live. See also our <Link href="/privacy">Privacy Policy</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
