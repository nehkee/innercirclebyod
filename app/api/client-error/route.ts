import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, clientId } from '@/lib/fraud';
import { reportError } from '@/lib/alerts';

const Body = z.object({ message: z.string().max(500), digest: z.string().max(100).optional(), path: z.string().max(300).optional() });

/** Browser-side crashes reported by the error boundary. */
export async function POST(req: NextRequest) {
  const rl = await rateLimit(`client-error:${clientId(req)}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ ok: true });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (parsed.success) await reportError('Page crashed for a visitor', parsed.data.message, { path: parsed.data.path, digest: parsed.data.digest });
  return NextResponse.json({ ok: true });
}
