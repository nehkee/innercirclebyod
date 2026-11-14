/** Paystack one-time checkout (NGN). Amounts are in kobo. */
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
