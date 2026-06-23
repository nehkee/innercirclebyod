-- ============================================================
-- INNER CIRCLE BY OD — Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────────────────────────

CREATE TYPE membership_tier AS ENUM ('machine', 'insider', 'warlord', 'industry');
CREATE TYPE event_type AS ENUM ('listening_party', 'show', 'hangout', 'studio', 'industry', 'secret');
CREATE TYPE app_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE app_type AS ENUM ('hangout', 'studio', 'dinner', 'backstage', 'football');
CREATE TYPE drop_type AS ENUM ('merch', 'music', 'ticket', 'invite');
CREATE TYPE payment_provider AS ENUM ('stripe', 'paystack');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- ─── MEMBERS ────────────────────────────────────────────────────────────────────

CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  username        TEXT UNIQUE,
  avatar_url      TEXT,
  country         TEXT,
  tier            membership_tier DEFAULT 'machine',
  points          INTEGER DEFAULT 0,
  stripe_customer TEXT,           -- Stripe customer ID
  paystack_customer TEXT,         -- Paystack customer code
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_clerk_id ON members(clerk_id);
CREATE INDEX idx_members_tier ON members(tier);
CREATE INDEX idx_members_points ON members(points DESC);

-- ─── MEMBERSHIPS (subscriptions) ────────────────────────────────────────────────

CREATE TABLE memberships (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id        UUID REFERENCES members(id) ON DELETE CASCADE,
  tier             membership_tier NOT NULL,
  provider         payment_provider NOT NULL,
  provider_sub_id  TEXT,           -- Stripe sub ID or Paystack subscription code
  status           TEXT NOT NULL DEFAULT 'active',  -- active, canceled, past_due
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memberships_member_id ON memberships(member_id);

-- ─── EVENTS ─────────────────────────────────────────────────────────────────────

CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  type        event_type NOT NULL,
  date        TIMESTAMPTZ NOT NULL,
  location    TEXT NOT NULL,
  venue       TEXT,
  description TEXT,
  price_usd   DECIMAL(10,2) DEFAULT 0,
  price_ngn   DECIMAL(12,2) DEFAULT 0,
  capacity    INTEGER NOT NULL DEFAULT 100,
  sold        INTEGER NOT NULL DEFAULT 0,
  is_vip      BOOLEAN DEFAULT FALSE,
  is_secret   BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  min_tier    membership_tier,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_type ON events(type);

-- Prevent overselling
CREATE OR REPLACE FUNCTION check_event_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sold > (SELECT capacity FROM events WHERE id = NEW.event_id) THEN
    RAISE EXCEPTION 'Event is at capacity';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atomic increment for sold count
CREATE OR REPLACE FUNCTION increment_event_sold(event_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE events
  SET sold = sold + amount
  WHERE id = event_id AND (capacity - sold) >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient capacity';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ─── TICKETS ────────────────────────────────────────────────────────────────────

CREATE TABLE tickets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number    TEXT UNIQUE NOT NULL DEFAULT 'IC-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)),
  member_id        UUID REFERENCES members(id),
  event_id         UUID REFERENCES events(id),
  quantity         INTEGER NOT NULL DEFAULT 1,
  total_usd        DECIMAL(10,2),
  total_ngn        DECIMAL(12,2),
  provider         payment_provider,
  payment_ref      TEXT,
  qr_code          TEXT,           -- QR code data (URL or encoded ticket_number)
  checked_in       BOOLEAN DEFAULT FALSE,
  checked_in_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_member_id ON tickets(member_id);
CREATE INDEX idx_tickets_event_id  ON tickets(event_id);
CREATE INDEX idx_tickets_number    ON tickets(ticket_number);

-- ─── APPLICATIONS ───────────────────────────────────────────────────────────────

CREATE TABLE applications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        app_type NOT NULL,
  member_id   UUID REFERENCES members(id),
  user_name   TEXT NOT NULL,
  user_email  TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      app_status DEFAULT 'pending',
  reviewer_id UUID REFERENCES members(id),  -- admin who reviewed
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_status    ON applications(status);
CREATE INDEX idx_applications_member_id ON applications(member_id);

-- Rate limit: one application per type per member per month
CREATE UNIQUE INDEX idx_applications_rate_limit
  ON applications(member_id, type, DATE_TRUNC('month', created_at))
  WHERE status != 'rejected';

-- ─── RAFFLES ────────────────────────────────────────────────────────────────────

CREATE TABLE raffles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  prize        TEXT NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  entry_price_ngn INTEGER DEFAULT 0,
  max_entries  INTEGER,
  min_tier     membership_tier DEFAULT 'machine',
  winner_id    UUID REFERENCES members(id),
  drawn_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE raffle_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id   UUID REFERENCES raffles(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES members(id),
  quantity    INTEGER DEFAULT 1,
  payment_ref TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raffle_id, member_id)
);

-- ─── DROPS ──────────────────────────────────────────────────────────────────────

CREATE TABLE drops (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  type                  drop_type NOT NULL,
  description           TEXT,
  price_ngn             DECIMAL(12,2) DEFAULT 0,
  price_usd             DECIMAL(10,2) DEFAULT 0,
  quantity              INTEGER NOT NULL DEFAULT 100,
  sold                  INTEGER NOT NULL DEFAULT 0,
  drop_date             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ,
  image_url             TEXT,
  is_password_protected BOOLEAN DEFAULT FALSE,
  password_hash         TEXT,
  is_secret             BOOLEAN DEFAULT FALSE,
  min_tier              membership_tier,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS (drops) ─────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID REFERENCES members(id),
  drop_id     UUID REFERENCES drops(id),
  quantity    INTEGER DEFAULT 1,
  total_ngn   DECIMAL(12,2),
  total_usd   DECIMAL(10,2),
  provider    payment_provider,
  payment_ref TEXT,
  status      payment_status DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEMBER POINTS (gamification) ───────────────────────────────────────────────

CREATE TABLE point_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  ref_type    TEXT,   -- 'event', 'purchase', 'referral', 'membership'
  ref_id      UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_member_id ON point_transactions(member_id);

-- Auto-update member points total
CREATE OR REPLACE FUNCTION update_member_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE members
  SET points = (
    SELECT COALESCE(SUM(points), 0)
    FROM point_transactions
    WHERE member_id = NEW.member_id
  )
  WHERE id = NEW.member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_points
AFTER INSERT ON point_transactions
FOR EACH ROW EXECUTE FUNCTION update_member_points();

-- ─── INVITES (invite codes) ──────────────────────────────────────────────────────

CREATE TABLE invite_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES members(id),
  used_by     UUID REFERENCES members(id),
  max_uses    INTEGER DEFAULT 1,
  uses        INTEGER DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────────

CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  min_tier    membership_tier DEFAULT 'machine',
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WAITLIST ───────────────────────────────────────────────────────────────────

CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  source      TEXT DEFAULT 'join_page',   -- track where signups come from
  converted   BOOLEAN DEFAULT FALSE,      -- true once they become a full member
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);

-- Waitlist is insert-only from anonymous users; admin reads via service role
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_insert_only" ON waitlist FOR INSERT WITH CHECK (TRUE);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────────

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Members can read their own data
CREATE POLICY "members_own_data" ON members FOR ALL USING (clerk_id = auth.uid()::text);
CREATE POLICY "memberships_own_data" ON memberships FOR SELECT USING (
  member_id = (SELECT id FROM members WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "tickets_own_data" ON tickets FOR SELECT USING (
  member_id = (SELECT id FROM members WHERE clerk_id = auth.uid()::text)
);

-- Events are public readable
CREATE POLICY "events_public_read" ON events FOR SELECT USING (is_published = TRUE);
