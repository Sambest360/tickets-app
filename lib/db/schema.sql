-- Requires: CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Crowned In His Glory — Full System Database Schema
-- PostgreSQL 15+
--
-- Layers:
--   1. IMPLEMENTED  — tables that exist in production code today
--   2. TARGET       — normalized extensions for multi-event, payments, staff
--
-- Current Drizzle definitions: lib/db/src/schema/{tickets,checkins}.ts
-- Apply with: psql $DATABASE_URL -f lib/db/schema.sql
-- Dev push (Drizzle): pnpm --filter @workspace/db run push
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('admin', 'volunteer', 'attendee');

CREATE TYPE ticket_status AS ENUM ('active', 'cancelled', 'used');

CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TYPE payment_provider AS ENUM ('yoco', 'payfast', 'manual', 'free');

CREATE TYPE checkin_result AS ENUM ('valid', 'invalid', 'already_used');

CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'email');

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- 1. IMPLEMENTED — events (hard-coded as "CG2026" in app code today)
-- ---------------------------------------------------------------------------

CREATE TABLE events (
  id              TEXT PRIMARY KEY,                          -- e.g. 'CG2026'
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,                      -- e.g. 'crowned-in-glory-2026'
  description     TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  venue_name      TEXT NOT NULL,
  venue_address   TEXT,
  max_capacity    INTEGER NOT NULL DEFAULT 250,
  ticket_price    NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  currency        TEXT NOT NULL DEFAULT 'ZAR',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the live event
INSERT INTO events (id, name, slug, starts_at, venue_name, max_capacity, ticket_price)
VALUES (
  'CG2026',
  'Crowned In His Glory 2026',
  'crowned-in-glory-2026',
  '2026-06-20 18:00:00+02',
  'Port Elizabeth',
  250,
  50.00
);

-- ---------------------------------------------------------------------------
-- 1. IMPLEMENTED — tickets (denormalized attendee fields; matches Drizzle)
-- ---------------------------------------------------------------------------

CREATE TABLE tickets (
  id               SERIAL PRIMARY KEY,
  event_id         TEXT NOT NULL DEFAULT 'CG2026' REFERENCES events (id),
  ticket_number    TEXT NOT NULL UNIQUE,                     -- CG2026-000001
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  gender           TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  church_assembly  TEXT,
  status           ticket_status NOT NULL DEFAULT 'active',
  seat_number      TEXT NOT NULL,                            -- e.g. A-001
  qr_code          TEXT NOT NULL,                            -- data-URL PNG
  checked_in       BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_event_id ON tickets (event_id);
CREATE INDEX idx_tickets_status ON tickets (status);
CREATE INDEX idx_tickets_checked_in ON tickets (checked_in);
CREATE INDEX idx_tickets_created_at ON tickets (created_at DESC);
CREATE INDEX idx_tickets_phone ON tickets (phone);
CREATE INDEX idx_tickets_name ON tickets (last_name, first_name);

-- ---------------------------------------------------------------------------
-- 1. IMPLEMENTED — check_ins (audit log; matches Drizzle)
-- ---------------------------------------------------------------------------

CREATE TABLE check_ins (
  id              SERIAL PRIMARY KEY,
  ticket_id       INTEGER NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
  ticket_number   TEXT NOT NULL,
  attendee_name   TEXT NOT NULL,
  volunteer_name  TEXT,
  result          checkin_result NOT NULL DEFAULT 'valid',
  device_info     TEXT,                                      -- user-agent / device label
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_check_ins_ticket_id ON check_ins (ticket_id);
CREATE INDEX idx_check_ins_checked_in_at ON check_ins (checked_in_at DESC);

-- ---------------------------------------------------------------------------
-- 2. TARGET — users (admin + volunteer accounts; JWT auth today is env-based)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT UNIQUE,
  email           TEXT UNIQUE,
  phone           TEXT,
  display_name    TEXT NOT NULL,
  password_hash   TEXT,                                      -- bcrypt; null for OAuth
  role            user_role NOT NULL DEFAULT 'volunteer',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_identity_check CHECK (
    username IS NOT NULL OR email IS NOT NULL
  )
);

CREATE INDEX idx_users_role ON users (role);

-- ---------------------------------------------------------------------------
-- 2. TARGET — attendees (normalized registration profile; optional split)
-- ---------------------------------------------------------------------------

CREATE TABLE attendees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         TEXT NOT NULL REFERENCES events (id),
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  gender           TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  church_assembly  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, phone)
);

CREATE INDEX idx_attendees_event_id ON attendees (event_id);

-- Future: tickets.attendee_id UUID REFERENCES attendees(id)
-- Migration: backfill attendees from distinct (event_id, phone, name, gender, church_assembly)

-- ---------------------------------------------------------------------------
-- 2. TARGET — payments (Yoco / PayFast integration from product spec)
-- ---------------------------------------------------------------------------

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id           INTEGER NOT NULL REFERENCES tickets (id) ON DELETE RESTRICT,
  event_id            TEXT NOT NULL REFERENCES events (id),
  amount              NUMERIC(10, 2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'ZAR',
  provider            payment_provider NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  provider_reference  TEXT,                                  -- gateway transaction id
  provider_payload    JSONB,                                 -- raw webhook body
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_ticket_id ON payments (ticket_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_provider_ref ON payments (provider_reference);

-- ---------------------------------------------------------------------------
-- 2. TARGET — seat sections & seats (live seat allocation)
-- ---------------------------------------------------------------------------

CREATE TABLE seat_sections (
  id          SERIAL PRIMARY KEY,
  event_id    TEXT NOT NULL REFERENCES events (id),
  name        TEXT NOT NULL,                                 -- e.g. 'Section A'
  row_count   INTEGER NOT NULL,
  seats_per_row INTEGER NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (event_id, name)
);

CREATE TABLE seats (
  id              SERIAL PRIMARY KEY,
  section_id      INTEGER NOT NULL REFERENCES seat_sections (id) ON DELETE CASCADE,
  seat_label      TEXT NOT NULL,                             -- e.g. 'A-001'
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  ticket_id       INTEGER UNIQUE REFERENCES tickets (id),
  UNIQUE (section_id, seat_label)
);

CREATE INDEX idx_seats_available ON seats (section_id, is_available);

-- ---------------------------------------------------------------------------
-- 2. TARGET — notifications (SMS / WhatsApp / email delivery log)
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       INTEGER REFERENCES tickets (id) ON DELETE SET NULL,
  event_id        TEXT NOT NULL REFERENCES events (id),
  channel         notification_channel NOT NULL,
  recipient       TEXT NOT NULL,                             -- phone or email
  template_key    TEXT NOT NULL,                             -- e.g. 'ticket_confirmation'
  status          notification_status NOT NULL DEFAULT 'pending',
  provider_id     TEXT,                                        -- Twilio / Resend message id
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_ticket_id ON notifications (ticket_id);
CREATE INDEX idx_notifications_status ON notifications (status);

-- ---------------------------------------------------------------------------
-- 2. TARGET — audit_log (admin actions, exports, cancellations)
-- ---------------------------------------------------------------------------

CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  actor_user_id   UUID REFERENCES users (id) ON DELETE SET NULL,
  actor_username  TEXT,
  action          TEXT NOT NULL,                             -- e.g. 'ticket.cancel'
  entity_type     TEXT NOT NULL,                             -- e.g. 'ticket'
  entity_id       TEXT NOT NULL,
  metadata        JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- VIEWS — dashboard queries used by /api/stats today
-- ---------------------------------------------------------------------------

CREATE VIEW event_stats AS
SELECT
  e.id AS event_id,
  e.name AS event_name,
  e.max_capacity,
  e.ticket_price,
  COUNT(t.id) FILTER (WHERE t.status <> 'cancelled') AS total_tickets,
  COUNT(t.id) FILTER (WHERE t.status <> 'cancelled' AND t.checked_in) AS checked_in,
  COUNT(t.id) FILTER (WHERE t.status <> 'cancelled' AND NOT t.checked_in) AS pending_checkin,
  COUNT(t.id) FILTER (WHERE t.status <> 'cancelled' AND t.gender = 'Male') AS male_count,
  COUNT(t.id) FILTER (WHERE t.status <> 'cancelled' AND t.gender = 'Female') AS female_count,
  GREATEST(0, e.max_capacity - COUNT(t.id) FILTER (WHERE t.status <> 'cancelled')) AS remaining_capacity,
  COUNT(t.id) FILTER (WHERE t.status <> 'cancelled') * e.ticket_price AS total_revenue
FROM events e
LEFT JOIN tickets t ON t.event_id = e.id
GROUP BY e.id, e.name, e.max_capacity, e.ticket_price;

-- ---------------------------------------------------------------------------
-- TRIGGERS — keep updated_at fresh
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
