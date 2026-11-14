# INNER CIRCLE — Deployment Guide

Inner Circle is artist-neutral. Brand name, mark and socials live in `lib/brand.ts`
and `.env.local.example`; tiers and prices in `lib/constants.ts`; retention offers
and the refund window in `lib/support/config.ts`.

## 1. Accounts you need

| Service   | Used for                                   | Required? |
|-----------|--------------------------------------------|-----------|
| Vercel    | Hosting                                    | Yes       |
| Supabase  | Database                                   | Yes       |
| Clerk     | Sign-in                                    | Yes       |
| Stripe    | Card payments (USD), monthly memberships   | For cards |
| Paystack  | Naira payments (card, transfer, USSD)      | For NGN   |
| NOWPayments | Crypto (USDT/USDC/BTC)                   | For crypto|
| Resend    | Ticket, welcome and team emails            | Recommended |

## 2. Database

1. Create a Supabase project.
2. SQL editor → paste `supabase/schema.sql` → Run.
3. Copy the project URL, anon key and service-role key into your environment.

## 3. Environment variables

Copy `.env.local.example` to `.env.local` (locally) or into Vercel → Settings →
Environment Variables. Every variable is explained in that file. Payment methods
appear at checkout only once their keys are set.

## 4. Webhooks

| Provider    | URL                                             | Notes |
|-------------|-------------------------------------------------|-------|
| Clerk       | `https://<domain>/api/webhooks/clerk`           | user.created / updated / deleted |
| Stripe      | `https://<domain>/api/webhooks/stripe`          | checkout.session.completed, checkout.session.expired, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed |
| Paystack    | `https://<domain>/api/webhooks/paystack`        | Settings → API Keys & Webhooks |
| NOWPayments | sent automatically with each invoice            | Set the IPN secret; choose coins under "Coins settings" |

## 5. Email that reaches the inbox (Resend)

Ticket, welcome, reminder and drop emails come from `RESEND_FROM_EMAIL`. To keep
them out of spam:

1. Resend → Domains → **Add domain** → use a subdomain such as `mail.your-domain.com`.
2. Add the DNS records Resend shows you (SPF `TXT`, DKIM `CNAME`s, and the `MX`
   for bounces) at your domain registrar or DNS host. Wait until Resend shows **Verified**.
3. Add a DMARC record: `TXT _dmarc.your-domain.com  "v=DMARC1; p=none; rua=mailto:you@your-domain.com"`
   (tighten to `p=quarantine` after a couple of weeks of clean reports).
4. Set `RESEND_FROM_EMAIL=noreply@mail.your-domain.com` and `RESEND_API_KEY` in Vercel.
5. Send yourself a test (sign up, buy a free ticket) and check it lands in the inbox.

## 6. Deploy

1. vercel.com/new → import the GitHub repository → Deploy.
2. Add your domain in Vercel → Settings → Domains and set `NEXT_PUBLIC_APP_URL` to it.
3. Sign up on the live site, then make yourself an admin in Supabase:
   `UPDATE members SET is_admin = TRUE WHERE email = 'you@example.com';`
4. Open `/admin`: Overview, Inbox (support chat), Refunds, Applications, Events, Members.

## 7. Day-to-day

- **Events**: Admin → Events → Create event. Leave the photo empty to use the generated poster.
- **Drops & raffles**: Admin → Drops & Raffles. Drops can be password-protected or secret;
  raffles are free for eligible members and you draw winners with one click.
- **Waitlist & invitations**: Admin → Waitlist → Send invite. Turn on `NEXT_PUBLIC_INVITE_ONLY=true`
  to require an invite before anyone can buy a membership.
- **Door**: open `/admin/scan` on a phone at the door and scan tickets (camera or pasted code).
- **Retention inbox**: members who want to cancel or can't make an event talk to the
  concierge chat first (offers are applied automatically); anything it can't solve
  lands in Admin → Inbox, and the team is emailed if `SUPPORT_TEAM_EMAIL` is set.
- **Refunds**: Admin → Refunds lists open requests with their 7-day deadline. Card and
  Paystack refunds run with one click; crypto refunds are sent from the NOWPayments
  dashboard to the address the member gave, then marked as refunded.

## 8. Pre-launch checklist

- [ ] `supabase/schema.sql` run on the production database
- [ ] All keys set in Vercel (including `TICKET_SECRET` and `NEXT_PUBLIC_APP_URL`)
- [ ] Webhooks registered for Clerk, Stripe and Paystack
- [ ] Coins enabled in NOWPayments
- [ ] Admin account flagged (`is_admin = true`)
- [ ] Resend domain verified (section 5) and a test email received
- [ ] Stripe → Billing → Customer portal enabled (members update cards from their account)
- [ ] `CRON_SECRET` set (reminders run daily; on Vercel Pro change `vercel.json` to hourly)
- [ ] Privacy Policy and Terms reviewed by a lawyer; `NEXT_PUBLIC_LEGAL_*` set
- [ ] One small test purchase per payment method, then a test refund
- [ ] Brand, socials and copy reviewed for the artist you're launching with

## Development

```bash
npm install
npm run dev        # http://localhost:3000 — sample data is shown when Supabase isn't connected
npm test           # unit + scenario tests (payments, concierge bot, signatures, tiers)
npm run typecheck
```

GitHub Actions runs type-check, tests and a production build on every push (`.github/workflows/ci.yml`).
