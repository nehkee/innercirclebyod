import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: { TICKET_SECRET: 'test-secret', NOWPAYMENTS_IPN_SECRET: 'test-ipn-secret', PAYSTACK_SECRET_KEY: 'sk_test_fake' },
  },
  resolve: { alias: { '@': path.resolve(__dirname) } },
});
