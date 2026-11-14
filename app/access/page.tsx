import { AccessView } from '@/components/access/AccessView';
import { getRaffles } from '@/lib/drops';

export const revalidate = 60;
export const metadata = {
  title:       'Access | Inner Circle',
  description: 'Apply for closed-door experiences and enter member draws.',
};

export default async function AccessPage() {
  const raffles = await getRaffles();
  return <AccessView raffles={raffles} />;
}
