import { Resend } from 'resend';
import { rateLimit } from '@/lib/fraud';
import { fromEmail, siteUrl } from '@/lib/brand';

/**
 * Report a problem the team should know about. Always logs; also emails
 * ALERT_EMAIL (falls back to SUPPORT_TEAM_EMAIL) at most once per 15 minutes
 * per kind of problem, so an outage can't flood your inbox.
 */
export async function reportError(where: string, err: unknown, details: Record<string, unknown> = {}) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[alert] ${where}: ${message}`, details);

  const to = (process.env.ALERT_EMAIL || process.env.SUPPORT_TEAM_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!to.length || !process.env.RESEND_API_KEY) return;

  try {
    const rl = await rateLimit(`alert:${where}`, 1, 15 * 60 * 1000);
    if (!rl.allowed) return;
    const rows = Object.entries(details).map(([k, v]) => `<tr><td style="color:#8C8C8C;padding:2px 12px 2px 0">${k}</td><td>${escape(String(v))}</td></tr>`).join('');
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: fromEmail('Inner Circle Alerts'),
      to,
      subject: `[Inner Circle] Problem: ${where}`,
      html: `<div style="font-family:Arial,sans-serif;background:#080808;color:#fff;padding:24px">
        <p style="color:#CC0000;letter-spacing:3px;font-size:11px">ALERT</p>
        <h2 style="margin:0 0 12px">${escape(where)}</h2>
        <p style="color:#9CA3AF">${escape(message)}</p>
        <table style="font-size:13px;margin-top:12px">${rows}</table>
        <p style="margin-top:20px"><a style="color:#C9A84C" href="${siteUrl()}/admin">Open admin →</a></p>
      </div>`,
    });
  } catch (e) {
    console.error('Alert email failed', e);
  }
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)).slice(0, 2000);
}
