-- Run once in the Supabase SQL Editor (project fiynkulfsdibamuszdqq).
--
-- Before: the "anon" key could read every subscriber (email + unsubscribe token)
-- and insert rows directly, bypassing the website.
-- After: only the service role key (used by the Netlify functions) has access.
--
-- Deploy the new Netlify functions BEFORE running this: the old ones used the anon key.

DROP POLICY IF EXISTS "Allow public inserts" ON digest_subscribers;
DROP POLICY IF EXISTS "Allow public selects by email" ON digest_subscribers;
DROP POLICY IF EXISTS "Only service role can update" ON digest_subscribers;
DROP POLICY IF EXISTS "Only service role can delete" ON digest_subscribers;

ALTER TABLE digest_subscribers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON digest_subscribers FROM anon, authenticated;

-- Check: this must return no rows.
SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'digest_subscribers';
