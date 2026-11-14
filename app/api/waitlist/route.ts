import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient }         from '@/lib/supabase';
import { rateLimit, clientId }       from '@/lib/fraud';
import { Resend }                    from 'resend';
import { z }                         from 'zod';
import { fromEmail, siteUrl } from '@/lib/brand';

const getResend = () => new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');

const Schema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  // Rate limit: 3 signups per 10 min per IP
  const rl = await rateLimit(`waitlist:${clientId(req)}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid data.' },
      { status: 400 }
    );
  }

  const { name, email } = parsed.data;
  const admin = createAdminClient();

  // Check for duplicate email
  const { data: existing } = await admin
    .from('waitlist')
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1);

  if (existing && existing.length > 0) {
    // Silent success — don't leak whether email is registered
    return NextResponse.json({ success: true });
  }

  // Store in waitlist table
  const { error: dbErr } = await admin.from('waitlist').insert({
    name,
    email: email.toLowerCase(),
  });

  if (dbErr) {
    console.error('Waitlist DB error:', dbErr.message);
    return NextResponse.json({ error: 'Failed to save. Try again.' }, { status: 500 });
  }

  // Send welcome email
  const firstName = name.split(' ')[0] ?? name;

  const { error: emailErr } = await getResend().emails.send({
    from:    fromEmail('Inner Circle'),
    to:      [email],
    subject: `${firstName}, the circle sees you.`,
    html:    buildWelcomeEmail(name, firstName, email),
  });

  if (emailErr) {
    // Don't fail the request if only the email fails — record is saved
    console.error('Resend error:', emailErr);
  }

  return NextResponse.json({ success: true });
}

// ── Email template ────────────────────────────────────────────────────────────
function buildWelcomeEmail(fullName: string, firstName: string, _email: string): string {
  const GOLD = '#C9A84C';
  const BG   = '#080808';

  /*
   * CONTENT NOTE FOR THE TEAM:
   * Replace the text inside the <p> blocks below with the artist's own message.
   * The variables available are:
   *   firstName — the user's first name
   *   fullName  — their full name
   */
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome — Inner Circle</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Courier New',monospace;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table width="580" cellpadding="0" cellspacing="0" border="0"
          style="max-width:580px;border:1px solid #2A2A2A;background:${BG};">

          <!-- Top gold accent line -->
          <tr>
            <td style="height:2px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #1A1A1A;">
              <table>
                <tr>
                  <td style="width:36px;height:36px;border:1px solid ${GOLD};text-align:center;vertical-align:middle;">
                    <span style="font-family:Impact,sans-serif;font-size:16px;color:${GOLD};line-height:1;">IC</span>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:10px;letter-spacing:0.35em;color:${GOLD};">INNER CIRCLE</p>
                    <p style="margin:2px 0 0;font-size:8px;letter-spacing:0.2em;color:#444;">EST. BY INVITATION</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 40px 36px;">

              <!-- Label -->
              <p style="margin:0 0 20px;font-size:9px;letter-spacing:0.4em;color:${GOLD};">
                PERSONAL MESSAGE
              </p>

              <!-- Big greeting -->
              <p style="margin:0 0 4px;font-family:Impact,sans-serif;font-size:42px;
                         letter-spacing:0.04em;color:#FFFFFF;text-transform:uppercase;line-height:1;">
                ${firstName}.
              </p>
              <p style="margin:0 0 36px;font-family:Impact,sans-serif;font-size:42px;
                         letter-spacing:0.04em;color:${GOLD};text-transform:uppercase;line-height:1;">
                YOU'RE IN.
              </p>

              <!-- ── Personal message starts here ───────────────────── -->
              <!--
                REPLACE THIS SECTION WITH THE ARTIST'S EXACT WORDS.
                Keep the styling, just swap the text.
              -->
              <p style="margin:0 0 20px;font-size:14px;line-height:1.9;color:#9CA3AF;">
                [The artist's personal message to the new member goes here. This is where
                the voice of the artist speaks directly — welcoming them into the circle,
                setting the tone, making them feel chosen.]
              </p>

              <p style="margin:0 0 20px;font-size:14px;line-height:1.9;color:#9CA3AF;">
                [Second paragraph — can include what to expect next,
                what being a member means, or a line about the season.]
              </p>

              <p style="margin:0 0 36px;font-size:14px;line-height:1.9;color:#9CA3AF;">
                [Sign-off line — personal, direct, in the artist's voice.]
              </p>
              <!-- ── Personal message ends here ──────────────────────── -->

              <!-- Signature -->
              <p style="margin:0 0 4px;font-family:Impact,sans-serif;font-size:18px;color:#FFFFFF;letter-spacing:0.1em;">
                — THE CIRCLE
              </p>
              <p style="margin:0 0 40px;font-size:9px;letter-spacing:0.3em;color:#444;">
                INNER CIRCLE · BY INVITATION ◯
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2A2A2A,transparent);margin-bottom:36px;"></div>

              <!-- CTA -->
              <p style="margin:0 0 16px;font-size:9px;letter-spacing:0.3em;color:#444;">NEXT STEPS</p>
              <table>
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${siteUrl()}/membership"
                       style="display:inline-block;padding:14px 28px;border:1px solid ${GOLD};
                              color:${GOLD};font-size:10px;letter-spacing:0.35em;
                              text-decoration:none;text-transform:uppercase;">
                      VIEW TIERS →
                    </a>
                  </td>
                  <td>
                    <a href="${siteUrl()}/events"
                       style="display:inline-block;padding:14px 28px;border:1px solid #2A2A2A;
                              color:#666;font-size:10px;letter-spacing:0.35em;
                              text-decoration:none;text-transform:uppercase;">
                      SEE EVENTS →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1A1A1A;text-align:center;">
              <p style="margin:0 0 6px;font-size:8px;letter-spacing:0.25em;color:#333;">
                INNER CIRCLE · THE CIRCLE NEVER BREAKS ◯
              </p>
              <p style="margin:0;font-size:8px;letter-spacing:0.15em;color:#222;">
                You received this because you joined the Inner Circle waitlist.
              </p>
            </td>
          </tr>

          <!-- Bottom gold accent -->
          <tr>
            <td style="height:1px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
