import { z } from 'zod';

export const dropSchema = z.object({
  name:        z.string().trim().min(1).max(200),
  type:        z.enum(['merch', 'music', 'ticket', 'invite']),
  description: z.string().trim().max(2000).optional().nullable(),
  priceUSD:    z.number().min(0).max(100000),
  priceNGN:    z.number().min(0).max(100000000),
  quantity:    z.number().int().min(1).max(1000000),
  dropDate:    z.string().datetime({ offset: true }),
  endsAt:      z.string().datetime({ offset: true }).optional().nullable(),
  minTier:     z.enum(['initiate', 'insider', 'vanguard', 'sovereign']).optional().nullable(),
  isSecret:    z.boolean().optional(),
  isActive:    z.boolean().optional(),
  imageUrl:    z.string().url().max(1000).optional().nullable().or(z.literal('')),
  /** Plain password to set (stored hashed); empty string removes protection. */
  password:    z.string().max(100).optional(),
});

export function toDropRow(d: Partial<z.infer<typeof dropSchema>>) {
  const row: Record<string, unknown> = {};
  if (d.name !== undefined)        row.name = d.name;
  if (d.type !== undefined)        row.type = d.type;
  if (d.description !== undefined) row.description = d.description || null;
  if (d.priceUSD !== undefined)    row.price_usd = d.priceUSD;
  if (d.priceNGN !== undefined)    row.price_ngn = d.priceNGN;
  if (d.quantity !== undefined)    row.quantity = d.quantity;
  if (d.dropDate !== undefined)    row.drop_date = d.dropDate;
  if (d.endsAt !== undefined)      row.ends_at = d.endsAt || null;
  if (d.minTier !== undefined)     row.min_tier = d.minTier || null;
  if (d.isSecret !== undefined)    row.is_secret = d.isSecret;
  if (d.isActive !== undefined)    row.is_active = d.isActive;
  if (d.imageUrl !== undefined)    row.image_url = d.imageUrl || null;
  return row;
}

export const raffleSchema = z.object({
  title:             z.string().trim().min(1).max(200),
  description:       z.string().trim().max(2000).optional().nullable(),
  prizeDescription:  z.string().trim().min(1).max(500),
  minTier:           z.enum(['initiate', 'insider', 'vanguard', 'sovereign']).optional().nullable(),
  closesAt:          z.string().datetime({ offset: true }),
  entriesPerVanguard: z.number().int().min(1).max(10).default(2),
});
