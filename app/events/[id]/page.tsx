import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EventDetail } from '@/components/events/EventDetail';
import { getEvent } from '@/lib/data';
import { enabledPaymentMethods } from '@/lib/payments/config';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Event not found | Inner Circle' };
  return {
    title:       `${event.title} | Inner Circle`,
    description: event.description,
  };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  return <EventDetail event={event} methods={enabledPaymentMethods()} />;
}
