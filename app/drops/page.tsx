import { DropsView } from '@/components/drops/DropsView';
import { getDrops } from '@/lib/drops';
import { enabledPaymentMethods } from '@/lib/payments/config';

export const revalidate = 60;
export const metadata = {
  title:       'Drops | Inner Circle',
  description: 'Limited releases for members. No restocks. One per member.',
};

export default async function DropsPage() {
  const drops = await getDrops();
  return <DropsView drops={drops} methods={enabledPaymentMethods()} />;
}
