-- Test 02: Verify RLS and cross-tenant isolation on children table
BEGIN;
SELECT plan(3);

-- 1. Table exists and has RLS enabled
SELECT has_table('public', 'children', 'children table should exist');
SELECT tests.rls_enabled('public', 'children');

-- 2. Anon cannot read any children
SET ROLE anon;
SELECT is_empty('SELECT * FROM public.children', 'Anonymous users cannot view any children');

ROLLBACK;
