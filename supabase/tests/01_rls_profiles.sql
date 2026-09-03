-- Test 01: Verify RLS on profiles table
BEGIN;
SELECT plan(3);

-- 1. Table exists and has RLS enabled
SELECT has_table('public', 'profiles', 'profiles table should exist');
SELECT tests.rls_enabled('public', 'profiles');

-- 2. Anonymous user cannot read profiles
SET ROLE anon;
SELECT is_empty('SELECT * FROM public.profiles', 'Anonymous users cannot view any guardian profiles');

ROLLBACK;
