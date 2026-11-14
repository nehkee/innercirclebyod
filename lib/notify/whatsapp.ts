/**
 * WhatsApp Business (Meta Cloud API) notifications.
 *
 * Business-initiated WhatsApp messages must use templates pre-approved in
 * Meta Business Manager. Create these (body text with the numbered variables)
 * and put their names in the env vars below:
 *   WHATSAPP_TEMPLATE_TICKET   — "Your ticket for {{1}} on {{2}} is confirmed. Show your QR at the door: {{3}}"
 *   WHATSAPP_TEMPLATE_REMINDER — "{{1}} is tomorrow ({{2}}). Your ticket is in your account: {{3}}"
 *   WHATSAPP_TEMPLATE_DROP     — "The drop is live: {{1}}. Members first, one each: {{2}}"
 * Nothing is sent unless WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set,
 * and only to members who opted in on their account page.
 */

const GRAPH = 'https://graph.facebook.com/v20.0';

export type WhatsAppTemplate = 'ticket' | 'reminder' | 'drop';

const TEMPLATE_ENV: Record<WhatsAppTemplate, string> = {
  ticket:   'WHATSAPP_TEMPLATE_TICKET',
  reminder: 'WHATSAPP_TEMPLATE_REMINDER',
  drop:     'WHATSAPP_TEMPLATE_DROP',
};

export function whatsappEnabled(template?: WhatsAppTemplate): boolean {
  const base = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  return template ? base && Boolean(process.env[TEMPLATE_ENV[template]]) : base;
}

/** E.164 phone numbers only, e.g. +2348012345678 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, '');
  const withPlus = digits.startsWith('+') ? digits : digits.startsWith('00') ? `+${digits.slice(2)}` : null;
  return withPlus && /^\+[1-9]\d{7,14}$/.test(withPlus) ? withPlus : null;
}

export async function sendWhatsApp(
  to: string | null | undefined,
  template: WhatsAppTemplate,
  params: string[],
): Promise<boolean> {
  if (!to || !whatsappEnabled(template)) return false;
  try {
    const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'template',
        template: {
          name:     process.env[TEMPLATE_ENV[template]],
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [{ type: 'body', parameters: params.map(text => ({ type: 'text', text: text.slice(0, 200) })) }],
        },
      }),
    });
    if (!res.ok) console.error('WhatsApp send failed', res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (err) {
    console.error('WhatsApp send error', err);
    return false;
  }
}
