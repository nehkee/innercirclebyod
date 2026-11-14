import { DoorScanner } from '@/components/admin/DoorScanner';

export const metadata = { title: 'Door scanner | Inner Circle', robots: { index: false, follow: false } };

export default function ScanPage() {
  return <DoorScanner />;
}
