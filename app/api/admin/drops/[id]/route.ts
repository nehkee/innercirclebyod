import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { dropSchema, toDropRow } from '@/lib/drops-admin';
import { hashDropPassword } from '@/lib/drops';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });
  const parsed = dropSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const row = toDropRow(parsed.data);
  if (parsed.data.password !== undefined) {
    // empty string = remove protection; otherwise set a new password
    row.is_password_protected = Boolean(parsed.data.password);
    row.password_hash = parsed.data.password ? hashDropPassword(id, parsed.data.password) : null;
  }
  const { error } = await createAdminClient().from('drops').update(row).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath('/drops');
  return NextResponse.json({ ok: true });
}
