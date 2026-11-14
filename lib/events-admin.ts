import { z } from 'zod';

/** Validated event fields from the admin editor (camelCase → DB columns via toEventRow). */
export const eventSchema = z.object({
  title:       z.string().trim().min(1).max(200),
  type:        z.enum(['listening_party', 'show', 'hangout', 'studio', 'industry', 'secret']),
  date:        z.string().datetime({ offset: true }),
  location:    z.string().trim().min(1).max(200),
  venue:       z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().min(1).max(2000),
  priceUSD:    z.number().min(0).max(100000),
  priceNGN:    z.number().min(0).max(100000000),
  capacity:    z.number().int().min(1).max(100000),
  isVip:       z.boolean().optional(),
  isSecret:    z.boolean().optional(),
  isActive:    z.boolean().optional(),
  minTier:     z.enum(['initiate', 'insider', 'vanguard', 'sovereign']).optional().nullable(),
  imageUrl:    z.string().url().max(1000).optional().nullable().or(z.literal('')),
});

export type EventInput = z.infer<typeof eventSchema>;

export function toEventRow(e: Partial<EventInput>) {
  const row: Record<string, unknown> = {};
  if (e.title !== undefined)       row.title = e.title;
  if (e.type !== undefined)        row.type = e.type;
  if (e.date !== undefined)        row.date = e.date;
  if (e.location !== undefined)    row.location = e.location;
  if (e.venue !== undefined)       row.venue = e.venue || null;
  if (e.description !== undefined) row.description = e.description;
  if (e.priceUSD !== undefined)    row.price_usd = e.priceUSD;
  if (e.priceNGN !== undefined)    row.price_ngn = e.priceNGN;
  if (e.capacity !== undefined)    row.capacity = e.capacity;
  if (e.isVip !== undefined)       row.is_vip = e.isVip;
  if (e.isSecret !== undefined)    row.is_secret = e.isSecret;
  if (e.isActive !== undefined)    row.is_active = e.isActive;
  if (e.minTier !== undefined)     row.min_tier = e.minTier || null;
  if (e.imageUrl !== undefined)    row.image_url = e.imageUrl || null;
  return row;
}
