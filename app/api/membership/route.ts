import { NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

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
