-- ============================================================
-- INNER CIRCLE BY OD — Supabase Database Schema
-- ============================================================
-- This file matches the column names used by the API routes in app/api.
-- Run it once on a fresh Supabase project (SQL editor → paste → run).
--
-- Access model: every server route talks to Supabase with the service-role
-- key (lib/supabase.ts → createAdminClient), which bypasses RLS. RLS is
-- therefore enabled on every table with NO anon policies, except published
-- events, so the public anon key can never read member data directly.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────────────────────────

CREATE TYPE membership_tier  AS ENUM ('initiate', 'insider', 'vanguard', 'sovereign');
CREATE TYPE event_type       AS ENUM ('listening_party', 'show', 'hangout', 'studio', 'industry', 'secret');
CREATE TYPE app_status       AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE app_type         AS ENUM ('hangout', 'studio', 'dinner', 'backstage', 'football');
CREATE TYPE drop_type        AS ENUM ('merch', 'music', 'ticket', 'invite');
CREATE TYPE payment_provider AS ENUM ('stripe', 'paystack', 'crypto');

-- ─── MEMBERS ────────────────────────────────────────────────────────────────────
-- One row per Clerk user, created by the Clerk webhook (app/api/webhooks/clerk).

CREATE TABLE members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id          TEXT UNIQUE NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  username          TEXT UNIQUE,
  display_name      TEXT,
  avatar_url        TEXT,
  country           TEXT,            -- ISO 3166 alpha-2, e.g. 'NG'
  city              TEXT,
  tier              membership_tier NOT NULL DEFAULT 'initiate',
  points            INTEGER NOT NULL DEFAULT 0,
  is_admin          BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at        TIMESTAMPTZ,     -- soft delete (Clerk user.deleted)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_members_tier   ON members(tier);
CREATE INDEX idx_members_points ON members(points DESC);

-- ─── MEMBERSHIPS (subscriptions) ────────────────────────────────────────────────
-- One active subscription per member; upserted by the Stripe/Paystack webhooks.

CREATE TABLE memberships (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tier                    membership_tier NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'past_due', 'cancelled', 'inactive')),
  payment_provider        payment_provider NOT NULL,
  stripe_customer_id      TEXT,
  stripe_sub_id           TEXT UNIQUE,
  paystack_customer_code  TEXT,
  paystack_sub_code       TEXT UNIQUE,
  last_payment_ref        TEXT,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,  -- member chose to leave; access runs to period end
  paused_until            TIMESTAMPTZ,                     -- retention pause: no billing, no access until then
  bonus_tier              membership_tier,                 -- retention upgrade: higher tier at the same price…
  bonus_until             TIMESTAMPTZ,                     -- …until this date
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memberships_status ON memberships(status);

-- ─── EVENTS ─────────────────────────────────────────────────────────────────────
-- Only rows with is_active = TRUE appear on the public site.

CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  type         event_type NOT NULL,
  date         TIMESTAMPTZ NOT NULL,
  location     TEXT NOT NULL,        -- 'City, Country' — used for the CITIES stat
  venue        TEXT,
  description  TEXT,
  price_usd    NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_ngn    NUMERIC(12,2) NOT NULL DEFAULT 0,
  capacity     INTEGER NOT NULL DEFAULT 100 CHECK (capacity > 0),
  sold         INTEGER NOT NULL DEFAULT 0,
  is_vip       BOOLEAN NOT NULL DEFAULT FALSE,
  is_secret    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  min_tier     membership_tier,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_not_oversold CHECK (sold >= 0 AND sold <= capacity)
);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_type ON events(type);

-- Atomic increment for sold count; fails instead of overselling.
CREATE OR REPLACE FUNCTION increment_event_sold(event_id UUID, amount INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
  UPDATE events e
  SET    sold = e.sold + amount, updated_at = NOW()
  WHERE  e.id = increment_event_sold.event_id
    AND  (e.capacity - e.sold) >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient capacity';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ─── TICKETS ────────────────────────────────────────────────────────────────────

CREATE TABLE tickets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id),
  user_id           UUID NOT NULL REFERENCES members(id),
  payment_provider  payment_provider,
  payment_ref       TEXT UNIQUE,      -- one ticket per verified payment
  payment_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  status            TEXT NOT NULL DEFAULT 'valid'
                    CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  qr_token          TEXT,
  used_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)          -- one ticket per member per event
);

CREATE INDEX idx_tickets_user_id  ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);

-- ─── PAYMENTS (checkout orders) ─────────────────────────────────────────────────
-- One row per checkout attempt. Created before redirecting to Stripe /
-- Paystack / NOWPayments; the provider's webhook marks it paid and the
-- server issues the ticket or membership exactly once (lib/payments/fulfill.ts).

CREATE TABLE payments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id            UUID NOT NULL REFERENCES members(id),
  kind                 TEXT NOT NULL CHECK (kind IN ('membership', 'ticket')),
  tier                 membership_tier,                 -- membership purchases
  event_id             UUID REFERENCES events(id),      -- ticket purchases
  provider             payment_provider,                -- null for free tickets
  currency             TEXT NOT NULL CHECK (currency IN ('USD', 'NGN')),
  amount               NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'processing', 'fulfilled', 'failed', 'expired', 'needs_attention', 'refunded')),
  provider_ref         TEXT,          -- Stripe Checkout Session id / Paystack reference / NOWPayments invoice id
  provider_payment_id  TEXT,          -- Stripe payment intent or subscription / NOWPayments payment id
  failure_reason       TEXT,
  offer_id             UUID,          -- member_offers row applied at checkout (FK added below)
  discount_percent     INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at              TIMESTAMPTZ,
  fulfilled_at         TIMESTAMPTZ,
  CONSTRAINT payments_target CHECK (
    (kind = 'membership' AND tier IS NOT NULL) OR (kind = 'ticket' AND event_id IS NOT NULL)
  )
);

CREATE INDEX idx_payments_member   ON payments(member_id, created_at DESC);
CREATE INDEX idx_payments_status   ON payments(status);
CREATE UNIQUE INDEX idx_payments_provider_ref ON payments(provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- ─── MEMBER OFFERS (retention perks) ────────────────────────────────────────────
-- Granted by the support bot or the team. Discounts are applied automatically
-- at the member's next checkout; upgrades and pauses take effect immediately.

CREATE TABLE member_offers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('event_discount', 'membership_discount', 'tier_upgrade', 'pause')),
  percent     INTEGER CHECK (percent BETWEEN 1 AND 100),   -- discounts
  tier        membership_tier,                              -- upgrades
  months      INTEGER CHECK (months BETWEEN 1 AND 12),      -- upgrades / pauses
  source      TEXT NOT NULL DEFAULT 'bot' CHECK (source IN ('bot', 'team')),
  granted_by  UUID REFERENCES members(id),                  -- team member, when source = 'team'
  thread_id   UUID,                                         -- support conversation it came from
  expires_at  TIMESTAMPTZ,                                  -- unused discounts lapse
  used_at     TIMESTAMPTZ,
  payment_id  UUID REFERENCES payments(id),                 -- checkout that consumed a discount
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_offers_member ON member_offers(member_id, kind, created_at DESC);

ALTER TABLE payments
  ADD CONSTRAINT payments_offer_fk FOREIGN KEY (offer_id) REFERENCES member_offers(id);

-- ─── SUPPORT CHAT ───────────────────────────────────────────────────────────────
-- One thread per conversation. The bot handles the first steps (reason,
-- offers); "waiting_team" puts it in the admin inbox for a human.

CREATE TABLE support_threads (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id            UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  topic                TEXT NOT NULL CHECK (topic IN ('membership', 'ticket', 'general')),
  ticket_id            UUID REFERENCES tickets(id),
  status               TEXT NOT NULL DEFAULT 'bot'
                       CHECK (status IN ('bot', 'waiting_team', 'open', 'resolved')),
  stage                TEXT NOT NULL DEFAULT 'start',   -- bot state machine position
  reason               TEXT,                             -- why they wanted to leave
  outcome              TEXT CHECK (outcome IN ('saved', 'cancelled', 'refund_requested', 'refunded', 'resolved')),
  assigned_to          UUID REFERENCES members(id),
  member_last_read_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  team_last_read_at    TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_threads_member ON support_threads(member_id, updated_at DESC);
CREATE INDEX idx_support_threads_status ON support_threads(status, updated_at DESC);

CREATE TABLE support_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id   UUID NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  sender      TEXT NOT NULL CHECK (sender IN ('member', 'team', 'bot', 'system')),
  author_id   UUID REFERENCES members(id),
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  actions     JSONB,          -- quick-reply buttons offered with this message
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_messages_thread ON support_messages(thread_id, created_at);

-- ─── REFUND REQUESTS ────────────────────────────────────────────────────────────
-- Policy: we first offer a new date or a discount; if the member still wants
-- their money back, the team processes the refund within 7 days (due_at).

CREATE TABLE refund_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID NOT NULL REFERENCES members(id),
  thread_id       UUID REFERENCES support_threads(id),
  payment_id      UUID NOT NULL REFERENCES payments(id),
  ticket_id       UUID REFERENCES tickets(id),
  kind            TEXT NOT NULL CHECK (kind IN ('ticket', 'membership')),
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT NOT NULL,
  provider        payment_provider,
  status          TEXT NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested', 'refunded', 'declined', 'withdrawn', 'failed')),
  due_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  crypto_address  TEXT,          -- where to send crypto refunds (asked in chat)
  reason          TEXT,
  note            TEXT,          -- team note / failure details
  processed_by    UUID REFERENCES members(id),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refund_requests_status ON refund_requests(status, due_at);
-- At most one open refund request per payment
CREATE UNIQUE INDEX idx_refund_requests_open ON refund_requests(payment_id) WHERE status = 'requested';

-- ─── APPLICATIONS (experiences: hangouts, studio sessions, …) ───────────────────

CREATE TABLE applications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         app_type NOT NULL,
  member_id    UUID REFERENCES members(id),   -- null if applied while signed out
  user_name    TEXT NOT NULL,
  user_email   TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       app_status NOT NULL DEFAULT 'pending',
  reviewer_id  UUID REFERENCES members(id),
  review_note  TEXT,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_status    ON applications(status);
CREATE INDEX idx_applications_member_id ON applications(member_id);
CREATE INDEX idx_applications_email     ON applications(user_email);

-- ─── RAFFLES ────────────────────────────────────────────────────────────────────

CREATE TABLE raffles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  prize_description   TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'drawn')),
  min_tier            membership_tier,
  entries_per_warlord INTEGER NOT NULL DEFAULT 2,  -- extra entries for VANGUARD+
  closes_at           TIMESTAMPTZ,
  winner_id           UUID REFERENCES members(id),
  drawn_at            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per entry; WARLORD+ members get several rows (extra chances).
CREATE TABLE raffle_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id   UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES members(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raffle_entries_raffle ON raffle_entries(raffle_id, user_id);

-- ─── DROPS ──────────────────────────────────────────────────────────────────────

CREATE TABLE drops (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  type                  drop_type NOT NULL,
  description           TEXT,
  price_ngn             NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_usd             NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity              INTEGER NOT NULL DEFAULT 100,
  sold                  INTEGER NOT NULL DEFAULT 0,
  drop_date             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ,
  image_url             TEXT,
  is_password_protected BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash         TEXT,
  is_secret             BOOLEAN NOT NULL DEFAULT FALSE,
  min_tier              membership_tier,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT drops_not_oversold CHECK (sold >= 0 AND sold <= quantity)
);

-- ─── MEMBER POINTS (gamification) ───────────────────────────────────────────────

CREATE TABLE point_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,
  reason      TEXT NOT NULL DEFAULT 'system',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_member_id ON point_transactions(member_id);

-- Called by the API: admin.rpc('update_member_points', { member_id, points_delta })
CREATE OR REPLACE FUNCTION update_member_points(
  member_id    UUID,
  points_delta INTEGER,
  reason       TEXT DEFAULT 'system'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO point_transactions (member_id, points, reason)
  VALUES (update_member_points.member_id, points_delta, update_member_points.reason);

  UPDATE members m
  SET    points = m.points + points_delta, updated_at = NOW()
  WHERE  m.id = update_member_points.member_id;
END;
$$ LANGUAGE plpgsql;

-- ─── INVITE CODES ───────────────────────────────────────────────────────────────

CREATE TABLE invite_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  created_by  UUID NOT NULL REFERENCES members(id),
  note        TEXT,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_by     UUID UNIQUE REFERENCES members(id),   -- a member can redeem only one invite
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);

-- ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────────

CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  min_tier    membership_tier NOT NULL DEFAULT 'initiate',
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WAITLIST ───────────────────────────────────────────────────────────────────

CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  source      TEXT NOT NULL DEFAULT 'join_page',
  converted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);

-- ─── RATE LIMITS ────────────────────────────────────────────────────────────────
-- Shared counter so limits hold across serverless instances (lib/fraud.ts).

CREATE UNLOGGED TABLE rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL,
  reset_at  TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION rate_limit_hit(p_key TEXT, p_limit INTEGER, p_window_ms BIGINT)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  INSERT INTO rate_limits AS r (key, count, reset_at)
  VALUES (p_key, 1, NOW() + make_interval(secs => p_window_ms / 1000.0))
  ON CONFLICT (key) DO UPDATE
    SET count    = CASE WHEN r.reset_at < NOW() THEN 1 ELSE r.count + 1 END,
        reset_at = CASE WHEN r.reset_at < NOW()
                        THEN NOW() + make_interval(secs => p_window_ms / 1000.0)
                        ELSE r.reset_at END
  RETURNING r.count, r.reset_at INTO v_count, v_reset;

  RETURN QUERY SELECT v_count <= p_limit, GREATEST(p_limit - v_count, 0), v_reset;
END;
$$ LANGUAGE plpgsql;

-- Housekeeping: delete expired counters (schedule with pg_cron if available)
CREATE OR REPLACE FUNCTION purge_rate_limits() RETURNS VOID AS $$
  DELETE FROM rate_limits WHERE reset_at < NOW() - INTERVAL '1 day';
$$ LANGUAGE sql;

-- ─── PUBLIC STATS ───────────────────────────────────────────────────────────────
-- Real numbers for the homepage/footer (lib/data.ts → getCommunityStats).

CREATE OR REPLACE FUNCTION community_stats()
RETURNS TABLE (members BIGINT, events BIGINT, cities BIGINT, countries BIGINT) AS $$
  SELECT
    (SELECT COUNT(*) FROM members WHERE deleted_at IS NULL),
    (SELECT COUNT(*) FROM events  WHERE is_active AND date < NOW()),
    (SELECT COUNT(DISTINCT LOWER(TRIM(SPLIT_PART(location, ',', 1)))) FROM events WHERE is_active),
    (SELECT COUNT(DISTINCT country) FROM members WHERE deleted_at IS NULL AND country IS NOT NULL);
$$ LANGUAGE sql STABLE;

-- ─── updated_at TRIGGERS ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_members_updated     BEFORE UPDATE ON members     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_events_updated      BEFORE UPDATE ON events      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────────

ALTER TABLE members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops              ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_offers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits        ENABLE ROW LEVEL SECURITY;

-- Published events are public. Everything else is server-only (service role).
CREATE POLICY "events_public_read" ON events FOR SELECT USING (is_active = TRUE);

-- RPCs are server-only too
REVOKE EXECUTE ON FUNCTION update_member_points(UUID, INTEGER, TEXT)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION increment_event_sold(UUID, INTEGER)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION rate_limit_hit(TEXT, INTEGER, BIGINT)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION purge_rate_limits()                        FROM PUBLIC, anon, authenticated;

-- ─── FIRST ADMIN ────────────────────────────────────────────────────────────────
-- After signing up on the site, make yourself an admin:
--   UPDATE members SET is_admin = TRUE WHERE email = 'you@example.com';
