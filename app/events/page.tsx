import { EventsList } from '@/components/events/EventsList';
import { getEvents } from '@/lib/data';

export const revalidate = 60;
export const metadata   = {
  title:       'Events | Inner Circle',
  description: 'Private shows, listening rooms, studio sessions and closed-door hangouts. Members first.',
};

export default async function EventsPage() {
  const events = await getEvents({ includePast: true });
  return <EventsList events={events} />;
}
