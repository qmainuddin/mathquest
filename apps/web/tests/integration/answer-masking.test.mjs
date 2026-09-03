import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Answer Masking: Source files never expose solutions in client question definitions', () => {
  const mockDataPath = path.resolve('apps/web/lib/mock-data.ts');
  const content = fs.readFileSync(mockDataPath, 'utf8');

  // Extract the INITIAL_QUESTIONS block
  const questionsMatch = content.match(/export const INITIAL_QUESTIONS[\s\S]*?;\n\n/);
  assert.ok(questionsMatch, 'INITIAL_QUESTIONS array must be defined');

  const questionsBlock = questionsMatch[0];

  // Invariant: No correct_answer or solution field inside INITIAL_QUESTIONS
  assert.equal(
    questionsBlock.includes('correct_answer'),
    false,
    'INITIAL_QUESTIONS must never contain correct_answer'
  );
  assert.equal(
    questionsBlock.includes('correctAnswer'),
    false,
    'INITIAL_QUESTIONS must never contain correctAnswer'
  );
  assert.equal(
    questionsBlock.includes('isCorrect'),
    false,
    'INITIAL_QUESTIONS must never contain isCorrect'
  );
});

test('Answer Masking: Stored procedures strictly isolate question_solutions table', () => {
  const migrationPath = path.resolve('supabase/migrations/20260903000002_create_security_and_rls.sql');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');

  // Verify RLS is enabled on question_solutions
  assert.ok(
    migrationContent.includes('ALTER TABLE public.question_solutions ENABLE ROW LEVEL SECURITY;'),
    'RLS must be enabled on question_solutions'
  );

  // Verify no SELECT policy is granted to anon on question_solutions
  assert.equal(
    migrationContent.includes('ON public.question_solutions FOR SELECT'),
    false,
    'question_solutions must have NO client SELECT policy'
  );
});
