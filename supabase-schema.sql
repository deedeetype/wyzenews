-- Daily Digest Subscribers Table
-- Run this in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS digest_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'landing_page',
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  last_email_sent TIMESTAMP WITH TIME ZONE,
  email_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_digest_subscribers_email 
  ON digest_subscribers(email);

CREATE INDEX IF NOT EXISTS idx_digest_subscribers_active 
  ON digest_subscribers(active);

CREATE INDEX IF NOT EXISTS idx_digest_subscribers_subscribed_at 
  ON digest_subscribers(subscribed_at);

-- RLS (Row Level Security) Policies
-- Allow public inserts (subscriptions)
ALTER TABLE digest_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" 
  ON digest_subscribers 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow public to check if email exists (for duplicate detection)
CREATE POLICY "Allow public selects by email" 
  ON digest_subscribers 
  FOR SELECT 
  TO anon
  USING (true);

-- Only authenticated users (service role) can update/delete
CREATE POLICY "Only service role can update" 
  ON digest_subscribers 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Only service role can delete" 
  ON digest_subscribers 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_digest_subscribers_updated_at 
  BEFORE UPDATE ON digest_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE digest_subscribers IS 'Subscribers for Daily Digest newsletter';
COMMENT ON COLUMN digest_subscribers.email IS 'Subscriber email address';
COMMENT ON COLUMN digest_subscribers.active IS 'Whether subscription is active';
COMMENT ON COLUMN digest_subscribers.source IS 'Where the subscription came from (landing_page, etc)';
COMMENT ON COLUMN digest_subscribers.unsubscribe_token IS 'Unique token for unsubscribe links';
COMMENT ON COLUMN digest_subscribers.last_email_sent IS 'Timestamp of last email sent to subscriber';
COMMENT ON COLUMN digest_subscribers.email_count IS 'Total number of emails sent to subscriber';
