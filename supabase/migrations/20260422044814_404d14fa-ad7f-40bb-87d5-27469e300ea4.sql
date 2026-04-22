-- Public buckets serve files via CDN and do not require a SELECT RLS policy
-- on storage.objects for end-users to read individual files by URL.
-- Removing the broad SELECT policies prevents API-based listing while keeping
-- direct public URLs functional.

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public read video covers" ON storage.objects;