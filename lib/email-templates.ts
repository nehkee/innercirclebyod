import { qrImageUrl } from '@/lib/qr';
import { siteUrl } from '@/lib/brand';

const APP_URL  = siteUrl();
const BRAND_BG = '#080808';
const GOLD     = '#C9A84C';

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:'Courier New',monospace;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;border:1px solid #2A2A2A;background:${BRAND_BG};">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid #2A2A2A;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="width:40px;height:40px;border:1px solid ${GOLD};display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;">
                      <span style="font-family:Impact,sans-serif;font-size:18px;color:${GOLD};line-height:40px;padding:0 0 0 8px;">IC</span>
                    </div>
                    <span style="margin-left:12px;font-size:11px;letter-spacing:0.3em;color:${GOLD};vertical-align:middle;">INNER CIRCLE</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          ${body}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2A2A2A;text-align:center;">
              <p style="font-size:9px;letter-spacing:0.25em;color:#444444;margin:0;">
                INNER CIRCLE · THE CIRCLE NEVER BREAKS ◯
              </p>
              <p style="font-size:9px;letter-spacing:0.15em;color:#333333;margin:8px 0 0;">
                You received this because you are a member of Inner Circle.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ticketConfirmationEmail(params: {
  memberName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketId: string;
  token: string;
  tier: string;
}): { subject: string; html: string } {
  const body = `
    <tr>
      <td style="padding:40px 40px 0;">
        <p style="font-size:9px;letter-spacing:0.3em;color:${GOLD};margin:0 0 16px;">TICKET CONFIRMATION</p>
        <h1 style="font-family:Impact,sans-serif;font-size:36px;letter-spacing:0.05em;color:#FFFFFF;margin:0 0 8px;text-transform:uppercase;">
          ${params.eventTitle}
        </h1>
        <p style="color:#666666;font-size:11px;letter-spacing:0.2em;margin:0 0 32px;">
          ${params.eventDate}  ·  ${params.eventVenue}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="180" style="text-align:center;vertical-align:top;">
              <img
                src="${qrImageUrl(params.token)}"
                alt="Ticket QR Code"
                width="160"
                height="160"
                style="border:1px solid #2A2A2A;display:block;margin:0 auto;"
              />
              <p style="font-size:9px;letter-spacing:0.2em;color:#444444;margin:8px 0 0;">SCAN AT DOOR</p>
            </td>
            <td style="padding-left:24px;vertical-align:top;">
              <table width="100%">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #2A2A2A;">
                    <p style="font-size:9px;letter-spacing:0.25em;color:#444444;margin:0 0 4px;">MEMBER</p>
                    <p style="font-size:13px;letter-spacing:0.15em;color:#FFFFFF;margin:0;">${params.memberName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #2A2A2A;">
                    <p style="font-size:9px;letter-spacing:0.25em;color:#444444;margin:0 0 4px;">TIER</p>
                    <p style="font-size:13px;letter-spacing:0.15em;color:${GOLD};margin:0;text-transform:uppercase;">${params.tier}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="font-size:9px;letter-spacing:0.25em;color:#444444;margin:0 0 4px;">TICKET ID</p>
                    <p style="font-size:10px;letter-spacing:0.1em;color:#555555;margin:0;">#${params.ticketId.slice(0, 8).toUpperCase()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 40px;">
        <p style="font-size:9px;letter-spacing:0.2em;color:#444444;margin:0 0 8px;border-top:1px solid #1A1A1A;padding-top:16px;">
          NO ENTRY WITHOUT THIS QR CODE. NO SCREENSHOTS FROM INSIDE.
        </p>
        <p style="font-size:9px;letter-spacing:0.2em;color:#333333;margin:0;">
          ONE TICKET PER PERSON. NON-TRANSFERABLE.
        </p>
      </td>
    </tr>`;

  return {
    subject: `Your ticket: ${params.eventTitle}`,
    html:    baseLayout(`Ticket — ${params.eventTitle}`, body),
  };
}

export function welcomeEmail(params: {
  memberName: string;
  tier: string;
  tierColor: string;
}): { subject: string; html: string } {
  const body = `
    <tr>
      <td style="padding:48px 40px 32px;">
        <p style="font-size:9px;letter-spacing:0.3em;color:${GOLD};margin:0 0 16px;">YOU'RE IN</p>
        <h1 style="font-family:Impact,sans-serif;font-size:40px;letter-spacing:0.05em;color:#FFFFFF;margin:0 0 4px;">
          WELCOME TO THE
        </h1>
        <h1 style="font-family:Impact,sans-serif;font-size:40px;letter-spacing:0.05em;color:${GOLD};margin:0 0 32px;">
          INNER CIRCLE
        </h1>
        <p style="color:#9CA3AF;font-size:14px;line-height:1.8;margin:0 0 24px;">
          ${params.memberName}, you have been granted access to the circle.<br/>
          Your tier: <span style="color:${params.tierColor};text-transform:uppercase;">${params.tier}</span>
        </p>
        <p style="color:#666666;font-size:11px;line-height:1.8;margin:0 0 32px;">
          Keep it secret. Keep it elite. The circle is only as strong as its members.
        </p>
        <a
          href="${APP_URL}/community"
          style="display:inline-block;padding:14px 32px;border:1px solid ${GOLD};color:${GOLD};font-size:11px;letter-spacing:0.3em;text-decoration:none;text-transform:uppercase;"
        >
          ENTER THE CIRCLE →
        </a>
      </td>
    </tr>`;

  return {
    subject: `Welcome to Inner Circle — ${params.tier.toUpperCase()}`,
    html:    baseLayout('Welcome to Inner Circle', body),
  };
}

export function dropNotificationEmail(params: {
  memberName: string;
  dropTitle: string;
  dropType: string;
  dropUrl: string;
  windowHours: number;
}): { subject: string; html: string } {
  const body = `
    <tr>
      <td style="padding:48px 40px 32px;">
        <p style="font-size:9px;letter-spacing:0.3em;color:${GOLD};margin:0 0 16px;">EXCLUSIVE DROP</p>
        <h1 style="font-family:Impact,sans-serif;font-size:36px;letter-spacing:0.05em;color:#FFFFFF;margin:0 0 8px;text-transform:uppercase;">
          ${params.dropTitle}
        </h1>
        <p style="font-size:11px;letter-spacing:0.2em;color:#666666;margin:0 0 24px;text-transform:uppercase;">
          ${params.dropType} DROP — MEMBERS ONLY
        </p>
        <p style="color:#9CA3AF;font-size:14px;line-height:1.8;margin:0 0 8px;">
          ${params.memberName}, your exclusive ${params.windowHours}-hour early access window is now open.
        </p>
        <p style="color:#666666;font-size:12px;margin:0 0 32px;">
          This window closes in ${params.windowHours} hours. Don't sleep.
        </p>
        <a
          href="${params.dropUrl}"
          style="display:inline-block;padding:14px 32px;border:1px solid ${GOLD};color:${GOLD};font-size:11px;letter-spacing:0.3em;text-decoration:none;text-transform:uppercase;"
        >
          ACCESS THE DROP →
        </a>
      </td>
    </tr>`;

  return {
    subject: `[MEMBER DROP] ${params.dropTitle} — Your early access window is open`,
    html:    baseLayout(`Drop: ${params.dropTitle}`, body),
  };
}

export function raffleResultEmail(params: {
  memberName: string;
  raffleName: string;
  won: boolean;
  prizeDetails?: string;
}): { subject: string; html: string } {
  const body = params.won
    ? `
    <tr>
      <td style="padding:48px 40px 32px;">
        <p style="font-size:9px;letter-spacing:0.3em;color:${GOLD};margin:0 0 16px;">YOU WON</p>
        <h1 style="font-family:Impact,sans-serif;font-size:40px;letter-spacing:0.05em;color:${GOLD};margin:0 0 24px;">
          CONGRATULATIONS
        </h1>
        <p style="color:#9CA3AF;font-size:14px;line-height:1.8;margin:0 0 16px;">
          ${params.memberName}, you have been selected from the ${params.raffleName} raffle.
        </p>
        ${params.prizeDetails ? `<p style="color:#666666;font-size:12px;line-height:1.8;margin:0 0 32px;">${params.prizeDetails}</p>` : ''}
        <p style="font-size:11px;letter-spacing:0.2em;color:#444444;margin:0;">
          THE TEAM WILL REACH OUT WITHIN 48 HOURS WITH NEXT STEPS.
        </p>
      </td>
    </tr>`
    : `
    <tr>
      <td style="padding:48px 40px 32px;">
        <p style="font-size:9px;letter-spacing:0.3em;color:#444444;margin:0 0 16px;">RAFFLE RESULT</p>
        <h1 style="font-family:Impact,sans-serif;font-size:36px;letter-spacing:0.05em;color:#FFFFFF;margin:0 0 24px;">
          NOT THIS TIME
        </h1>
        <p style="color:#666666;font-size:14px;line-height:1.8;margin:0;">
          ${params.memberName}, you weren't selected for the ${params.raffleName} raffle this time.
          Stay in the circle — more draws are coming.
        </p>
      </td>
    </tr>`;

  return {
    subject: params.won
      ? `🏆 You won the ${params.raffleName} raffle`
      : `Raffle result: ${params.raffleName}`,
    html: baseLayout('Raffle Result', body),
  };
}
