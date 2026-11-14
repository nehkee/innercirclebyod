import { MembershipView } from '@/components/membership/MembershipView';
import { enabledPaymentMethods } from '@/lib/payments/config';

export const metadata = {
  title:       'Membership | Inner Circle by OD',
  description: 'Choose your tier: MACHINE, INSIDER, WARLORD or INDUSTRY. Pay by card, Paystack or crypto.',
};

export default function MembershipPage() {
  return <MembershipView methods={enabledPaymentMethods()} />;
}
