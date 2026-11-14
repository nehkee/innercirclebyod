import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EventDetail } from '@/components/events/EventDetail';
import { getEvent } from '@/lib/data';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await getEvent(params.id);
  if (!event) return { title: 'Event not found | Inner Circle by OD' };
  return {
    title:       `${event.title} | Inner Circle by OD`,
    description: event.description,
  };
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id);
  if (!event) notFound();
  return <EventDetail event={event} />;
}
