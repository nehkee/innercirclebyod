// Paystack Plan Codes for each membership tier (NGN)
export const PAYSTACK_PLAN_CODES: Record<string, string> = {
  machine:  process.env.PAYSTACK_MACHINE_PLAN  || '',
  insider:  process.env.PAYSTACK_INSIDER_PLAN  || '',
  warlord:  process.env.PAYSTACK_WARLORD_PLAN  || '',
  industry: process.env.PAYSTACK_INDUSTRY_PLAN || '',
};

// Tier prices in NGN (kobo for Paystack API)
export const TIER_PRICES_NGN: Record<string, number> = {
  machine:  1500000,  // ₦15,000
  insider:  3800000,  // ₦38,000
  warlord:  11500000, // ₦115,000
  industry: 30000000, // ₦300,000
};

export async function initializePaystackTransaction({
  email,
  amount,
  reference,
  metadata,
  callbackUrl,
}: {
  email:       string;
  amount:      number;
  reference:   string;
  metadata:    Record<string, unknown>;
  callbackUrl: string;
}) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount, reference, metadata, callback_url: callbackUrl }),
  });

  if (!res.ok) throw new Error('Paystack initialization failed');
  return res.json();
}

export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error('Paystack verification failed');
  return res.json();
}
