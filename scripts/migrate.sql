-- Migration: Add admin column to users and create events tables
-- Date: 2026-03-06

-- 1. Add is_admin column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP,
  location VARCHAR(255),
  image_url VARCHAR(500),
  category VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);

-- 5. Enable Row Level Security on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for events
-- Anyone can view events
CREATE POLICY IF NOT EXISTS "Allow public read events" ON events
  FOR SELECT USING (true);

-- Only admin or creator can insert events
CREATE POLICY IF NOT EXISTS "Allow insert events for admin" ON events
  FOR INSERT WITH CHECK (
    (SELECT is_admin FROM auth.users WHERE id = auth.uid()) OR 
    (created_by = auth.uid())
  );

-- Only admin or creator can update their events
CREATE POLICY IF NOT EXISTS "Allow update own events" ON events
  FOR UPDATE USING (
    (SELECT is_admin FROM auth.users WHERE id = auth.uid()) OR 
    (created_by = auth.uid())
  );

-- Only admin or creator can delete events
CREATE POLICY IF NOT EXISTS "Allow delete own events" ON events
  FOR DELETE USING (
    (SELECT is_admin FROM auth.users WHERE id = auth.uid()) OR 
    (created_by = auth.uid())
  );

-- 7. Create RLS policies for event_registrations
-- Users can view their own registrations
CREATE POLICY IF NOT EXISTS "Allow read own registrations" ON event_registrations
  FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM auth.users WHERE id = auth.uid()));

-- Users can register for events
CREATE POLICY IF NOT EXISTS "Allow insert registrations" ON event_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own registrations
CREATE POLICY IF NOT EXISTS "Allow delete own registrations" ON event_registrations
  FOR DELETE USING (user_id = auth.uid() OR (SELECT is_admin FROM auth.users WHERE id = auth.uid()));
