import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { dropSchema, toDropRow } from '@/lib/drops-admin';
import { hashDropPassword } from '@/lib/drops';

export const dynamic = 'force-dynamic';

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });
  const { data, error } = await createAdminClient()
    .from('drops')
    .select('id, name, type, description, price_usd, price_ngn, quantity, sold, drop_date, ends_at, image_url, min_tier, is_password_protected, is_secret, is_active')
    .order('drop_date', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drops: data ?? [] });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });
  const parsed = dropSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('drops').insert(toDropRow(parsed.data)).select('id').single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });

  // The hash is salted with the drop's id, so set it once the id exists
  if (parsed.data.password) {
    await admin.from('drops').update({
      is_password_protected: true,
      password_hash: hashDropPassword(data.id, parsed.data.password),
    }).eq('id', data.id);
  }
  revalidatePath('/drops');
  return NextResponse.json({ id: data.id }, { status: 201 });
}
