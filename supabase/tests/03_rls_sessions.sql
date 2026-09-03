-- Test 03: Verify learning sessions RLS
BEGIN;
SELECT plan(3);

-- 1. Table exists and has RLS enabled
SELECT has_table('public', 'learning_sessions', 'learning_sessions table should exist');
SELECT tests.rls_enabled('public', 'learning_sessions');

-- 2. Anon cannot read any learning sessions
SET ROLE anon;
SELECT is_empty('SELECT * FROM public.learning_sessions', 'Anonymous users cannot view sessions');

ROLLBACK;
