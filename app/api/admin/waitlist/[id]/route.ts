import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { generateInviteCode } from '@/lib/qr';
import { noticeEmail } from '@/lib/email-templates';
import { fromEmail } from '@/lib/brand';

/** Approve someone on the waitlist: create an invite code (valid 14 days) and email it. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: 'Forbidden' }, { status: check.status });

  const admin = createAdminClient();
  const { data: entry } = await admin.from('waitlist').select('id, name, email, invited_at').eq('id', id).maybeSingle();
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const code = generateInviteCode();
  const { error } = await admin.from('invite_codes').insert({
    code, created_by: check.member.id, note: `Waitlist: ${entry.email}`,
    expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
  });
  if (error) return NextResponse.json({ error: 'Could not create invite' }, { status: 500 });
  await admin.from('waitlist').update({ invited_at: new Date().toISOString(), invite_code: code }).eq('id', entry.id);

  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    const { subject, html } = noticeEmail({
      subject:    'Your invitation to the Inner Circle',
      label:      'BY INVITATION',
      title:      'YOU’VE BEEN CHOSEN',
      paragraphs: [
        `${entry.name.split(' ')[0]}, a seat has opened in the Inner Circle, and it’s yours if you want it.`,
        `Your personal invite code is ${code}. It works once and expires in 14 days.`,
      ],
      ctaLabel: 'Claim your seat',
      ctaPath:  `/invite?code=${code}`,
    });
    const res = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: fromEmail(), to: [entry.email], subject, html }).catch(() => null);
    emailed = Boolean(res && !res.error);
  }
  return NextResponse.json({ ok: true, code, emailed });
}
