import { NextRequest, NextResponse } from 'next/server';
import { createHmac }                from 'crypto';
import { createAdminClient }         from '@/lib/supabase';
import { welcomeEmail }              from '@/lib/email-templates';
import { Resend }                    from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

/** Verify Svix/Clerk webhook signature manually (no external package) */
function verifyClerkWebhook(
  payload:   string,
  svixId:    string,
  timestamp: string,
  signature: string,
  secret:    string
): boolean {
  try {
    // Secret starts with "whsec_", strip prefix then base64-decode
    const secretKey = secret.startsWith('whsec_')
      ? Buffer.from(secret.slice(6), 'base64')
      : Buffer.from(secret, 'base64');

    const message = `${svixId}.${timestamp}.${payload}`;
    const hmac    = createHmac('sha256', secretKey).update(message).digest('base64');

    // svix-signature may have multiple comma-separated values
    const sigs = signature.split(' ').map(s => s.replace(/^v1,/, ''));
    return sigs.some(s => s === hmac);
  } catch {
    return false;
  }
}

type ClerkWebhookEvent =
  | { type: 'user.created'; data: { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string; last_name?: string; username?: string } }
  | { type: 'user.updated'; data: { id: string; email_addresses: Array<{ email_address: string }>; first_name?: string; last_name?: string } }
  | { type: 'user.deleted'; data: { id: string } };

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const payload   = await req.text();
  const svixId    = req.headers.get('svix-id')        ?? '';
  const svixTs    = req.headers.get('svix-timestamp') ?? '';
  const svixSig   = req.headers.get('svix-signature') ?? '';

  if (!verifyClerkWebhook(payload, svixId, svixTs, svixSig, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const event: ClerkWebhookEvent = JSON.parse(payload);
  const admin = createAdminClient();

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, username } = event.data;
    const email  = email_addresses[0]?.email_address;
    const name   = [first_name, last_name].filter(Boolean).join(' ') || username || 'Member';
    const handle = (username || name).toUpperCase().replace(/\s+/g, '_');

    const { error } = await admin.from('members').insert({
      clerk_id: id,
      email,
      username: handle,
      tier:     'machine',
      points:   0,
    });

    if (!error && email) {
      const { subject, html } = welcomeEmail({
        memberName: name,
        tier:       'MACHINE',
        tierColor:  '#9CA3AF',
      });
      await getResend().emails.send({
        from:    'Inner Circle <welcome@innercirclebyod.com>',
        to:      [email],
        subject,
        html,
      });
    }
  }

  if (event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = event.data;
    const email = email_addresses[0]?.email_address;
    const name  = [first_name, last_name].filter(Boolean).join(' ');

    await admin
      .from('members')
      .update({ email, ...(name ? { display_name: name } : {}) })
      .eq('clerk_id', id);
  }

  if (event.type === 'user.deleted') {
    await admin
      .from('members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('clerk_id', event.data.id);
  }

  return NextResponse.json({ received: true });
}
