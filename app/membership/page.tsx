import { MembershipView } from '@/components/membership/MembershipView';
import { enabledPaymentMethods } from '@/lib/payments/config';

export const metadata = {
  title:       'Membership | Inner Circle',
  description: 'Choose your tier: INITIATE, INSIDER, VANGUARD or SOVEREIGN. Pay by card, Paystack or crypto.',
};

export default function MembershipPage() {
  return <MembershipView methods={enabledPaymentMethods()} />;
}
