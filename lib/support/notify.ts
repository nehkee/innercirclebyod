import { Resend } from 'resend';
import { fromEmail, siteUrl } from '@/lib/brand';

/**
 * Email the team (SUPPORT_TEAM_EMAIL, comma-separated) when a conversation
 * needs a human: a member asked for the team, cancelled, or asked for a refund.
 * Silently does nothing if email isn't configured; the admin inbox still shows it.
 */
export async function notifyTeam(subject: string, lines: string[], threadId?: string) {
  const to = (process.env.SUPPORT_TEAM_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!to.length || !process.env.RESEND_API_KEY) return;

  const link = `${siteUrl()}/admin${threadId ? `?thread=${threadId}` : ''}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#080808;color:#9CA3AF;padding:24px">
      <p style="color:#C9A84C;letter-spacing:3px;font-size:11px;margin:0 0 12px">INNER CIRCLE · SUPPORT</p>
      <h2 style="color:#fff;margin:0 0 16px">${escapeHtml(subject)}</h2>
      ${lines.map(l => `<p style="margin:0 0 8px">${escapeHtml(l)}</p>`).join('')}
      <p style="margin:20px 0 0"><a href="${link}" style="color:#C9A84C">Open the inbox →</a></p>
    </div>`;

  await new Resend(process.env.RESEND_API_KEY).emails
    .send({ from: fromEmail('Inner Circle Support'), to, subject: `[Inner Circle] ${subject}`, html })
    .catch(err => console.error('Team notification failed', err));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
