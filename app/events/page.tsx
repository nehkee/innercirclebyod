import { EventsList } from '@/components/events/EventsList';
import { getEvents } from '@/lib/data';

export const revalidate = 60;
export const metadata   = {
  title:       'Events | Inner Circle by OD',
  description: 'Private shows, listening parties, studio sessions and hangouts with Odumodublvck.',
};

export default async function EventsPage() {
  const events = await getEvents({ includePast: true });
  return <EventsList events={events} />;
}
