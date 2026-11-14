import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, clientId } from '@/lib/fraud';
import { unlockDrop } from '@/lib/drops';
import { isSupabaseConfigured } from '@/lib/supabase';

const Body = z.object({ dropId: z.string().uuid(), password: z.string().min(1).max(100) });

/** Check a drop password; on success returns the drop's real name and details. */
export async function POST(req: NextRequest) {
  const rl = await rateLimit(`drop-unlock:${clientId(req)}`, 8, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Wrong password' }, { status: 403 });

  const drop = await unlockDrop(parsed.data.dropId, parsed.data.password);
  if (!drop) return NextResponse.json({ error: 'Wrong password' }, { status: 403 });
  return NextResponse.json({ drop });
}
