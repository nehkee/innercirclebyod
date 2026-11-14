import { auth } from '@clerk/nextjs/server';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase';

/** True when both Clerk keys are present. Without them, sign-in is disabled. */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

/**
 * The signed-in user's Clerk ID, or null.
 * Safe to call when Clerk isn't configured (returns null instead of throwing).
 */
export function getClerkUserId(): string | null {
  if (!isClerkConfigured()) return null;
  return auth().userId ?? null;
}

export interface CurrentMember {
  id:       string;
  clerk_id: string;
  email:    string;
  username: string | null;
  tier:     'initiate' | 'insider' | 'vanguard' | 'sovereign';
  is_admin: boolean;
  access_granted: boolean;
}

/** Load the signed-in user's member row, or null if signed out / not synced yet. */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const clerkId = getClerkUserId();
  if (!clerkId || !isSupabaseConfigured()) return null;

  const { data } = await createAdminClient()
    .from('members')
    .select('id, clerk_id, email, username, tier, is_admin, access_granted')
    .eq('clerk_id', clerkId)
    .is('deleted_at', null)
    .maybeSingle();

  return (data as CurrentMember | null) ?? null;
}

export type AdminCheck =
  | { ok: true;  member: CurrentMember }
  | { ok: false; status: 401 | 403 };

/** Require a signed-in member with `is_admin = true`. */
export async function requireAdmin(): Promise<AdminCheck> {
  if (!getClerkUserId()) return { ok: false, status: 401 };
  const member = await getCurrentMember();
  if (!member?.is_admin) return { ok: false, status: 403 };
  return { ok: true, member };
}
