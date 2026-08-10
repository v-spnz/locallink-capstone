-- Ensure PostgREST immediately discovers the quote-tracking RPCs added by the
-- preceding migration on hosted projects with a stale schema cache.
notify pgrst, 'reload schema';
