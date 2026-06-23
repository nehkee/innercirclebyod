# INNER CIRCLE BY OD — Deployment Guide

## Prerequisites

- Node.js 18+
- npm or pnpm
- Vercel account
- Supabase account
- Clerk account
- Stripe account
- Paystack account (for Nigerian users)
- Resend account (email)

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

### Required Keys:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | clerk.com → API Keys |
| `CLERK_SECRET_KEY` | clerk.com → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → API |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → API (keep secret) |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → Developers |
| `PAYSTACK_SECRET_KEY` | paystack.com → Settings → API Keys |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | paystack.com → Settings → API Keys |
| `RESEND_API_KEY` | resend.com → API Keys |

---

## 3. Database Setup (Supabase)

1. Create a new Supabase project at supabase.com
2. Go to SQL Editor
3. Run the contents of `supabase/schema.sql`
4. Enable Row Level Security (already in schema)

---

## 4. Clerk Auth Setup

1. Create app at clerk.com
2. Configure sign-in methods (Email + Google recommended)
3. Add webhook: `https://yourdomain.com/api/webhooks/clerk`
4. Sync users to Supabase via webhook

---

## 5. Stripe Setup

1. Create products and prices for each membership tier:
   - MACHINE: $10/month recurring
   - INSIDER: $25/month recurring
   - WARLORD: $75/month recurring
   - INDUSTRY: $200/month recurring
2. Add price IDs to `.env.local`:
   ```
   STRIPE_MACHINE_PRICE_ID=price_xxx
   STRIPE_INSIDER_PRICE_ID=price_xxx
   STRIPE_WARLORD_PRICE_ID=price_xxx
   STRIPE_INDUSTRY_PRICE_ID=price_xxx
   ```
3. Set up webhook: `https://yourdomain.com/api/payments/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`

---

## 6. Paystack Setup

1. Create plans for each tier (NGN):
   - MACHINE: ₦15,000/month
   - INSIDER: ₦38,000/month
   - WARLORD: ₦115,000/month
   - INDUSTRY: ₦300,000/month
2. Add plan codes to `.env.local`:
   ```
   PAYSTACK_MACHINE_PLAN=PLN_xxx
   PAYSTACK_INSIDER_PLAN=PLN_xxx
   PAYSTACK_WARLORD_PLAN=PLN_xxx
   PAYSTACK_INDUSTRY_PLAN=PLN_xxx
   ```
3. Set up webhook: `https://yourdomain.com/api/payments/paystack`

---

## 7. Local Development

```bash
npm run dev
```

Open http://localhost:3000

---

## 8. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set production env vars
vercel env add CLERK_SECRET_KEY production
# ... add all other env vars
```

Or connect the GitHub repo to Vercel dashboard for automatic deployments.

### Vercel Settings:
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 18.x

---

## 9. Custom Domain

In Vercel dashboard:
1. Go to Settings → Domains
2. Add `innercirclebyod.com`
3. Update DNS records at your registrar:
   ```
   A     @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```

---

## 10. Admin Access

Navigate to `/admin` — currently accessible without auth.
To protect it, wrap with Clerk middleware:

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/membership", "/events", "/community", "/drops"],
  ignoredRoutes: ["/api/payments/stripe", "/api/payments/paystack"],
});
```

Add admin user IDs to an environment variable and check in the admin page.

---

## Architecture Overview

```
innercirclebyod.com
├── Frontend     → Next.js 14 (App Router) on Vercel
├── Database     → Supabase (PostgreSQL + RLS)
├── Auth         → Clerk
├── Payments     → Stripe (USD) + Paystack (NGN)
├── Email        → Resend
├── Media        → Vercel Blob or Cloudinary
└── Domain       → innercirclebyod.com → Vercel
```
