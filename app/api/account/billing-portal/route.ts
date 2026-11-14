import { NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { siteUrl } from '@/lib/brand';

/**
 * Open Stripe's hosted billing portal so a card member can update their card,
 * see invoices, or download receipts. (Enable the portal once in Stripe →
 * Settings → Billing → Customer portal.)
 */
export async function POST() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: m } = await createAdminClient()
    .from('memberships')
    .select('stripe_customer_id')
    .eq('user_id', member.id)
    .maybeSingle();
  if (!m?.stripe_customer_id) {
    return NextResponse.json({ error: 'No card on file — card management is for card memberships.' }, { status: 400 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer:   m.stripe_customer_id,
      return_url: `${siteUrl()}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Billing portal failed', err);
    return NextResponse.json({ error: 'Card management is temporarily unavailable.' }, { status: 502 });
  }
}
