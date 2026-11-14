import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

const subscribeSchema = z.object({
  tierId:   z.enum(['machine', 'insider', 'warlord', 'industry']),
  currency: z.enum(['USD', 'NGN']),
  userId:   z.string().min(1),
  email:    z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tierId, currency, userId, email } = parsed.data;

    if (currency === 'NGN') {
      // Paystack subscription
      // const response = await fetch('https://api.paystack.co/subscription', {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     customer: email,
      //     plan: PAYSTACK_PLAN_CODES[tierId],
      //   }),
      // });
      // const data = await response.json();
      return NextResponse.json({ checkoutUrl: 'https://paystack.com/checkout/test', provider: 'paystack' });
    } else {
      // Stripe subscription
      // const session = await stripe.checkout.sessions.create({
      //   mode: 'subscription',
      //   customer_email: email,
      //   line_items: [{ price: STRIPE_PRICE_IDS[tierId], quantity: 1 }],
      //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership/success`,
      //   cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/membership`,
      //   metadata: { userId, tierId },
      // });
      return NextResponse.json({ checkoutUrl: 'https://checkout.stripe.com/test', provider: 'stripe' });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to initiate checkout' }, { status: 500 });
  }
}

export async function GET() {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await createAdminClient()
    .from('memberships')
    .select('tier, status, payment_provider, current_period_end')
    .eq('user_id', member.id)
    .maybeSingle();

  return NextResponse.json({ membership: data ?? null });
}
