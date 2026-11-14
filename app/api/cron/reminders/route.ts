import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';
import { noticeEmail } from '@/lib/email-templates';
import { fromEmail, siteUrl } from '@/lib/brand';
import { sendWhatsApp } from '@/lib/notify/whatsapp';
import { effectiveTier, tierRank, type MembershipRow } from '@/lib/membership';
import type { MembershipTier } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Scheduled job (vercel.json → crons). Vercel calls it with
 * "Authorization: Bearer <CRON_SECRET>".
 *  1. Event reminders: tickets for events starting in the next 18–42 hours.
 *  2. Drop alerts: drops that went live in the last 24 hours.
 * Each reminder/alert is sent once (tickets.reminder_sent_at, drops.alerted_at).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ skipped: 'database not configured' });

  const admin  = createAdminClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const now    = Date.now();
  const hour   = 3_600_000;
  const summary = { reminders: 0, whatsapp: 0, dropAlerts: 0 };

  // ── 1. Event reminders ──────────────────────────────────────────────────────
  const { data: events } = await admin
    .from('events')
    .select('id, title, date, location, venue')
    .eq('is_active', true)
    .gte('date', new Date(now + 18 * hour).toISOString())
    .lte('date', new Date(now + 42 * hour).toISOString());

  for (const ev of events ?? []) {
    const { data: tickets } = await admin
      .from('tickets')
      .select('id, user_id, members (email, username, phone, whatsapp_opt_in)')
      .eq('event_id', ev.id)
      .eq('status', 'valid')
      .is('reminder_sent_at', null)
      .limit(1000);

    const when = new Date(ev.date).toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    for (const t of tickets ?? []) {
      // Claim first so a re-run never double-sends
      const { data: claimed } = await admin.from('tickets').update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', t.id).is('reminder_sent_at', null).select('id');
      if (!claimed?.length) continue;

      const m = (Array.isArray(t.members) ? t.members[0] : t.members) as { email: string; username: string | null; phone: string | null; whatsapp_opt_in: boolean } | null;
      if (!m) continue;
      if (resend && m.email) {
        const { subject, html } = noticeEmail({
          subject: `Tomorrow: ${ev.title}`, label: 'SEE YOU TOMORROW', title: ev.title,
          paragraphs: [
            `${m.username ?? 'You'}, it's ${when} in ${ev.location.split(',')[0]}.`,
            'Your entry QR is on your account page. Turn your brightness up at the door. No phones once you are inside.',
          ],
          ctaLabel: 'Show my ticket', ctaPath: '/account',
        });
        await resend.emails.send({ from: fromEmail(), to: [m.email], subject, html }).catch(() => null);
        summary.reminders++;
      }
      if (m.whatsapp_opt_in && await sendWhatsApp(m.phone, 'reminder', [ev.title, when, `${siteUrl()}/account`])) summary.whatsapp++;
    }
  }

  // ── 2. Drop alerts ──────────────────────────────────────────────────────────
  const { data: drops } = await admin
    .from('drops')
    .select('id, name, min_tier')
    .eq('is_active', true)
    .is('alerted_at', null)
    .lte('drop_date', new Date(now).toISOString())
    .gte('drop_date', new Date(now - 24 * hour).toISOString());

  for (const drop of drops ?? []) {
    const { data: claimed } = await admin.from('drops').update({ alerted_at: new Date().toISOString() })
      .eq('id', drop.id).is('alerted_at', null).select('id');
    if (!claimed?.length) continue;

    // Members whose current tier qualifies
    const { data: rows } = await admin
      .from('memberships')
      .select('user_id, tier, status, payment_provider, stripe_sub_id, current_period_end, cancel_at_period_end, paused_until, bonus_tier, bonus_until, members (email, username, phone, whatsapp_opt_in)')
      .in('status', ['active', 'past_due'])
      .limit(5000);
    const eligible = (rows ?? []).filter(r => {
      const t = effectiveTier(r as unknown as MembershipRow);
      return t && (!drop.min_tier || tierRank(t) >= tierRank(drop.min_tier as MembershipTier));
    });

    const link = `${siteUrl()}/drops`;
    const emails: { email: string; name: string }[] = [];
    for (const r of eligible) {
      const m = (Array.isArray(r.members) ? r.members[0] : r.members) as { email: string; username: string | null; phone: string | null; whatsapp_opt_in: boolean } | null;
      if (!m) continue;
      if (m.email) emails.push({ email: m.email, name: m.username ?? 'You' });
      if (m.whatsapp_opt_in && await sendWhatsApp(m.phone, 'drop', [drop.name, link])) summary.whatsapp++;
    }
    if (resend) {
      for (let i = 0; i < emails.length; i += 100) {
        const batch = emails.slice(i, i + 100).map(e => {
          const { subject, html } = noticeEmail({
            subject: `Live now: ${drop.name}`, label: 'THE DROP IS LIVE', title: drop.name,
            paragraphs: [`${e.name}, it's open to members now. Limited run, one each, no restock.`],
            ctaLabel: 'Secure it', ctaPath: '/drops',
          });
          return { from: fromEmail(), to: [e.email], subject, html };
        });
        await resend.batch.send(batch).catch(() => null);
      }
    }
    summary.dropAlerts++;
  }

  return NextResponse.json({ ok: true, ...summary });
}
