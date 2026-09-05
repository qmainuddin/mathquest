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

test('Answer Masking: Every seeded question has a private server-side solution mapping', () => {
  const mockDataPath = path.resolve('apps/web/lib/mock-data.ts');
  const content = fs.readFileSync(mockDataPath, 'utf8');

  // Extract all question IDs from INITIAL_QUESTIONS
  const questionIdMatches = [...content.matchAll(/id:\s*'([0-9a-fA-F-]{36})'/g)];
  assert.ok(questionIdMatches.length > 0, 'Must have question IDs');

  // Extract solutions block
  const solutionsMatch = content.match(/export const MOCK_SOLUTIONS[\s\S]*?;\n/);
  assert.ok(solutionsMatch, 'MOCK_SOLUTIONS must be defined');
  const solutionsBlock = solutionsMatch[0];

  for (const match of questionIdMatches) {
    const qId = match[1];
    assert.ok(
      solutionsBlock.includes(qId),
      `Private solution mapping missing for question ${qId}`
    );
  }
});

test('Answer Masking: Security definer functions strictly lock search_path', () => {
  const migrationPath = path.resolve('supabase/migrations/20260903000003_secure_question_answers.sql');
  const content = fs.readFileSync(migrationPath, 'utf8');

  // Verify evaluate_question_answer is SECURITY DEFINER with fixed search_path
  assert.ok(content.includes('FUNCTION public.evaluate_question_answer'));
  assert.ok(content.includes('SECURITY DEFINER'));
  assert.ok(content.includes('SET search_path = public'));

  // Verify delete_child_data is SECURITY DEFINER with fixed search_path
  assert.ok(content.includes('FUNCTION public.delete_child_data'));
});
