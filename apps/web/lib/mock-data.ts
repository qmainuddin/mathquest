import type { Topic, Lesson, Question } from '@mathquest/contracts';

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'number_sense',
    title: 'Number Sense & Place Value',
    description: 'Explore counting, place value, and rounding puzzles.',
    icon: 'Compass',
    orderIndex: 1,
  },
  {
    id: 'addition_subtraction',
    title: 'Addition & Subtraction',
    description: 'Master mental math, carrying, borrowing, and word problems.',
    icon: 'PlusMinus',
    orderIndex: 2,
  },
  {
    id: 'multiplication_division',
    title: 'Multiplication & Division',
    description: 'Discover times tables, array patterns, and sharing puzzles.',
    icon: 'Grid',
    orderIndex: 3,
  },
  {
    id: 'fractions',
    title: 'Introductory Fractions',
    description: 'Visualize halves, thirds, quarters, and fraction bars.',
    icon: 'PieChart',
    orderIndex: 4,
  },
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'ns_place_value_100',
    topicId: 'number_sense',
    title: 'Tens and Ones',
    description: 'Learn how two-digit numbers are built from tens and ones.',
    difficulty: 'easy',
    orderIndex: 1,
  },
  {
    id: 'ns_place_value_1000',
    topicId: 'number_sense',
    title: 'Hundreds, Tens, and Ones',
    description: 'Explore three-digit numbers and base-10 blocks.',
    difficulty: 'medium',
    orderIndex: 2,
  },
  {
    id: 'as_mental_addition_20',
    topicId: 'addition_subtraction',
    title: 'Number Bonds to 20',
    description: 'Quick visual addition within 20.',
    difficulty: 'easy',
    orderIndex: 1,
  },
  {
    id: 'md_arrays_intro',
    topicId: 'multiplication_division',
    title: 'Array Explorers',
    description: 'See multiplication as equal rows and columns.',
    difficulty: 'easy',
    orderIndex: 1,
  },
  {
    id: 'fr_halves_quarters',
    topicId: 'fractions',
    title: 'Halves and Quarters',
    description: 'Identify equal parts of a whole shape.',
    difficulty: 'easy',
    orderIndex: 1,
  },
];

export const INITIAL_QUESTIONS: Record<string, Question[]> = {
  ns_place_value_100: [
    {
      id: '11111111-1111-4111-8111-111111111101',
      lessonId: 'ns_place_value_100',
      prompt: 'What number is shown by 4 tens and 7 ones?',
      questionType: 'multiple_choice',
      options: {
        choices: [
          { id: 'a', label: '47' },
          { id: 'b', label: '74' },
          { id: 'c', label: '40' },
          { id: 'd', label: '11' },
        ],
      },
      hint: 'Count the 4 bundles of ten (40) plus 7 individual ones.',
      orderIndex: 1,
    },
    {
      id: '11111111-1111-4111-8111-111111111102',
      lessonId: 'ns_place_value_100',
      prompt: 'In the number 63, what digit is in the tens place?',
      questionType: 'numeric_input',
      options: {
        placeholder: 'Type the digit',
      },
      hint: 'Look at the first digit on the left in a 2-digit number.',
      orderIndex: 2,
    },
  ],
  as_mental_addition_20: [
    {
      id: '22222222-2222-4222-8222-222222222201',
      lessonId: 'as_mental_addition_20',
      prompt: 'What is 8 + 7?',
      questionType: 'multiple_choice',
      options: {
        choices: [
          { id: 'a', label: '13' },
          { id: 'b', label: '15' },
          { id: 'c', label: '16' },
          { id: 'd', label: '14' },
        ],
      },
      hint: 'Think: 8 + 2 makes 10, then add the remaining 5.',
      orderIndex: 1,
    },
    {
      id: '22222222-2222-4222-8222-222222222202',
      lessonId: 'as_mental_addition_20',
      prompt: 'Solve: 14 + 5 = ?',
      questionType: 'numeric_input',
      options: {
        placeholder: 'Enter answer',
      },
      hint: 'Add 5 to 4 ones, keeping the 10 intact.',
      orderIndex: 2,
    },
  ],
  md_arrays_intro: [
    {
      id: '33333333-3333-4333-8333-333333333301',
      lessonId: 'md_arrays_intro',
      prompt: 'An array has 3 rows with 4 apples in each row. How many apples in total?',
      questionType: 'multiple_choice',
      options: {
        choices: [
          { id: 'a', label: '7' },
          { id: 'b', label: '12' },
          { id: 'c', label: '10' },
          { id: 'd', label: '14' },
        ],
        gridRows: 3,
        gridCols: 4,
      },
      hint: 'Multiply the number of rows by the count per row (3 x 4).',
      orderIndex: 1,
    },
  ],
  fr_halves_quarters: [
    {
      id: '44444444-4444-4444-8444-444444444401',
      lessonId: 'fr_halves_quarters',
      prompt: 'A pizza is cut into 4 equal slices. If you eat 1 slice, what fraction of the pizza did you eat?',
      questionType: 'multiple_choice',
      options: {
        choices: [
          { id: 'a', label: '1/2' },
          { id: 'b', label: '1/4' },
          { id: 'c', label: '3/4' },
          { id: 'd', label: '1/3' },
        ],
        totalBars: 4,
        filledBars: 1,
      },
      hint: 'The denominator (bottom number) is the total slices: 4.',
      orderIndex: 1,
    },
  ],
};

// SERVER-SIDE PRIVATE SOLUTIONS TABLE (For fallback & mock evaluation)
export const MOCK_SOLUTIONS: Record<string, { correct: Record<string, unknown>; explanation: string }> = {
  '11111111-1111-4111-8111-111111111101': {
    correct: { choiceId: 'a', value: '47' },
    explanation: '4 tens is 40, and 7 ones is 7. 40 + 7 = 47.',
  },
  '11111111-1111-4111-8111-111111111102': {
    correct: { value: '6' },
    explanation: 'In 63, the 6 represents 6 tens (60), and the 3 represents 3 ones.',
  },
  '22222222-2222-4222-8222-222222222201': {
    correct: { choiceId: 'b', value: '15' },
    explanation: '8 + 7 = 15.',
  },
  '22222222-2222-4222-8222-222222222202': {
    correct: { value: '19' },
    explanation: '14 + 5 = 19.',
  },
  '33333333-3333-4333-8333-333333333301': {
    correct: { choiceId: 'b', value: '12' },
    explanation: '3 rows of 4 apples = 3 x 4 = 12 apples.',
  },
  '44444444-4444-4444-8444-444444444401': {
    correct: { choiceId: 'b', value: '1/4' },
    explanation: '1 slice out of 4 equal slices is 1/4.',
  },
};
