-- Test 04: Verify solutions are masked from client access
BEGIN;
SELECT plan(3);

-- 1. Verify questions table does NOT have correct_answer column
SELECT hasnt_column('public', 'questions', 'correct_answer', 'questions table must NOT contain correct_answer column');

-- 2. Verify question_solutions has RLS enabled
SELECT tests.rls_enabled('public', 'question_solutions');

-- 3. Verify anon cannot read question_solutions
SET ROLE anon;
SELECT is_empty('SELECT * FROM public.question_solutions', 'Anonymous users cannot read solutions');

ROLLBACK;
