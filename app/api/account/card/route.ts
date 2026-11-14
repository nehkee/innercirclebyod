import { memberCardResponse } from '@/lib/og/member-card-image';

export const dynamic = 'force-dynamic';

export function GET() {
  return memberCardResponse();
}
