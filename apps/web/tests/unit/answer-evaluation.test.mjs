import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Extract MOCK_SOLUTIONS dynamically from apps/web/lib/mock-data.ts
const mockDataPath = path.resolve('apps/web/lib/mock-data.ts');
const fileContent = fs.readFileSync(mockDataPath, 'utf8');
const solutionsMatch = fileContent.match(/export const MOCK_SOLUTIONS[\s\S]*?=\s*([\s\S]*?);\n/);
if (!solutionsMatch) {
  throw new Error('Could not find MOCK_SOLUTIONS in mock-data.ts');
}
const rawSolutionsStr = solutionsMatch[1].trim();
const MOCK_SOLUTIONS = Function(`"use strict"; return (${rawSolutionsStr});`)();

// Core answer evaluation function under test (mirrors app/api/learning/attempt/submit/route.ts)
function evaluateAnswer(questionId, submittedAnswer) {
  const solution = MOCK_SOLUTIONS[questionId];
  if (!solution) return null;

  let isCorrect = false;

  const subChoiceId = submittedAnswer?.choiceId
    ? String(submittedAnswer.choiceId).trim().toLowerCase()
    : null;
  const subValue =
    submittedAnswer?.value !== undefined && submittedAnswer?.value !== null
      ? String(submittedAnswer.value).trim().toLowerCase()
      : null;

  const solChoiceId = solution.correct?.choiceId
    ? String(solution.correct.choiceId).trim().toLowerCase()
    : null;
  const solValue =
    solution.correct?.value !== undefined && solution.correct?.value !== null
      ? String(solution.correct.value).trim().toLowerCase()
      : null;

  // 1. Exact match on choice identifier (e.g. 'a' === 'a')
  if (subChoiceId && solChoiceId && subChoiceId === solChoiceId) {
    isCorrect = true;
  }
  // 2. Exact match on textual answer value (e.g. '47' === '47' or '1/4' === '1/4')
  else if (subValue && solValue && subValue === solValue) {
    isCorrect = true;
  }
  // 3. Numeric normalization match (e.g. '047' === '47' or 47 === 47)
  else if (
    subValue !== null &&
    solValue !== null &&
    !isNaN(Number(subValue)) &&
    !isNaN(Number(solValue)) &&
    Number(subValue) === Number(solValue)
  ) {
    isCorrect = true;
  }
  // 4. Cross-match: client sent value as choiceId or choiceId as value
  else if (subChoiceId && solValue && subChoiceId === solValue) {
    isCorrect = true;
  } else if (subValue && solChoiceId && subValue === solChoiceId) {
    isCorrect = true;
  }

  return {
    isCorrect,
    explanation: isCorrect ? 'Super job! That is correct!' : 'Nice try! Check the hint or give it another shot.',
  };
}

test('Answer Evaluation: 4 tens and 7 ones correctly evaluates to 47 with choiceId "a"', () => {
  const qId = '11111111-1111-4111-8111-111111111101';
  // User selects option 'a' (which corresponds to "47")
  const result = evaluateAnswer(qId, { choiceId: 'a' });
  assert.equal(result.isCorrect, true);
  assert.ok(result.explanation.includes('correct'));
});

test('Answer Evaluation: 4 tens and 7 ones evaluates to 47 with value "47"', () => {
  const qId = '11111111-1111-4111-8111-111111111101';
  const result = evaluateAnswer(qId, { value: '47' });
  assert.equal(result.isCorrect, true);
});

test('Answer Evaluation: 4 tens and 7 ones evaluates to 47 when both choiceId and value are sent', () => {
  const qId = '11111111-1111-4111-8111-111111111101';
  const result = evaluateAnswer(qId, { choiceId: 'a', value: '47' });
  assert.equal(result.isCorrect, true);
});

test('Answer Evaluation: 4 tens and 7 ones rejects incorrect choice "b" (74)', () => {
  const qId = '11111111-1111-4111-8111-111111111101';
  const result = evaluateAnswer(qId, { choiceId: 'b', value: '74' });
  assert.equal(result.isCorrect, false);
});

test('Answer Evaluation: Tens digit in 63 accepts correct numeric input "6"', () => {
  const qId = '11111111-1111-4111-8111-111111111102';
  const result = evaluateAnswer(qId, { value: '6' });
  assert.equal(result.isCorrect, true);
});

test('Answer Evaluation: Tens digit in 63 normalizes whitespace and leading zeros', () => {
  const qId = '11111111-1111-4111-8111-111111111102';
  const result = evaluateAnswer(qId, { value: ' 06 ' });
  assert.equal(result.isCorrect, true);
});

test('Answer Evaluation: Tens digit in 63 rejects wrong numeric input "3"', () => {
  const qId = '11111111-1111-4111-8111-111111111102';
  const result = evaluateAnswer(qId, { value: '3' });
  assert.equal(result.isCorrect, false);
});

test('Answer Evaluation: 8 + 7 accepts choice "b" and value "15"', () => {
  const qId = '22222222-2222-4222-8222-222222222201';
  assert.equal(evaluateAnswer(qId, { choiceId: 'b' }).isCorrect, true);
  assert.equal(evaluateAnswer(qId, { value: '15' }).isCorrect, true);
  assert.equal(evaluateAnswer(qId, { choiceId: 'a', value: '13' }).isCorrect, false);
});

test('Answer Evaluation: ns_place_value_1000 questions evaluate correctly', () => {
  // Q1: 5 hundreds, 3 tens, 8 ones -> 538 (choice a)
  assert.equal(
    evaluateAnswer('11111111-1111-4111-8111-111111111201', { choiceId: 'a', value: '538' }).isCorrect,
    true
  );
  // Q2: Value of 7 in 729 -> 700 (choice b)
  assert.equal(
    evaluateAnswer('11111111-1111-4111-8111-111111111202', { choiceId: 'b', value: '700' }).isCorrect,
    true
  );
  // Q3: Tens in 420 -> 42
  assert.equal(
    evaluateAnswer('11111111-1111-4111-8111-111111111203', { value: '42' }).isCorrect,
    true
  );
});

test('Answer Evaluation: Unknown question returns null', () => {
  const result = evaluateAnswer('non-existent-uuid', { value: '123' });
  assert.equal(result, null);
});
