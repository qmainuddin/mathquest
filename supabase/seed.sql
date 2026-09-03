-- Seed Data for MathQuest Topics, Lessons, Questions, and Solutions

-- 1. Topics
INSERT INTO public.topics (id, title, description, icon, order_index) VALUES
('number_sense', 'Number Sense & Place Value', 'Explore counting, place value, and rounding puzzles.', 'Compass', 1),
('addition_subtraction', 'Addition & Subtraction', 'Master mental math, carrying, borrowing, and word problems.', 'PlusMinus', 2),
('multiplication_division', 'Multiplication & Division', 'Discover times tables, array patterns, and sharing puzzles.', 'Grid', 3),
('fractions', 'Introductory Fractions', 'Visualize halves, thirds, quarters, and fraction bars.', 'PieChart', 4)
ON CONFLICT (id) DO NOTHING;

-- 2. Lessons for Number Sense
INSERT INTO public.lessons (id, topic_id, title, description, difficulty, order_index) VALUES
('ns_place_value_100', 'number_sense', 'Tens and Ones', 'Learn how two-digit numbers are built from tens and ones.', 'easy', 1),
('ns_place_value_1000', 'number_sense', 'Hundreds, Tens, and Ones', 'Explore three-digit numbers and base-10 blocks.', 'medium', 2),
('ns_rounding_10', 'number_sense', 'Rounding to Nearest 10', 'Use a visual number line to round numbers to the nearest 10.', 'easy', 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Lessons for Addition & Subtraction
INSERT INTO public.lessons (id, topic_id, title, description, difficulty, order_index) VALUES
('as_mental_addition_20', 'addition_subtraction', 'Number Bonds to 20', 'Quick visual addition within 20.', 'easy', 1),
('as_two_digit_add', 'addition_subtraction', 'Two-Digit Addition', 'Add 2-digit numbers with and without regrouping.', 'medium', 2),
('as_subtraction_bridge', 'addition_subtraction', 'Subtracting Across Tens', 'Jump backwards on the number line.', 'medium', 3)
ON CONFLICT (id) DO NOTHING;

-- 4. Lessons for Multiplication & Division
INSERT INTO public.lessons (id, topic_id, title, description, difficulty, order_index) VALUES
('md_arrays_intro', 'multiplication_division', 'Array Explorers', 'See multiplication as equal rows and columns.', 'easy', 1),
('md_times_tables_2_5_10', 'multiplication_division', '2, 5, and 10 Times Tables', 'Spot patterns in the friendliest times tables.', 'easy', 2),
('md_fair_share', 'multiplication_division', 'Fair Share Division', 'Divide objects equally into groups.', 'medium', 3)
ON CONFLICT (id) DO NOTHING;

-- 5. Lessons for Fractions
INSERT INTO public.lessons (id, topic_id, title, description, difficulty, order_index) VALUES
('fr_halves_quarters', 'fractions', 'Halves and Quarters', 'Identify equal parts of a whole shape.', 'easy', 1),
('fr_fraction_bars', 'fractions', 'Fraction Bar Comparisons', 'Compare simple fractions like 1/2, 1/3, and 1/4.', 'medium', 2)
ON CONFLICT (id) DO NOTHING;

-- 6. Questions and Solutions (Example sets for core lessons)

-- Lesson: ns_place_value_100
INSERT INTO public.questions (id, lesson_id, prompt, question_type, options, hint, order_index) VALUES
('11111111-1111-4111-8111-111111111101', 'ns_place_value_100', 'What number is shown by 4 tens and 7 ones?', 'multiple_choice', '{"choices": [{"id": "a", "label": "47"}, {"id": "b", "label": "74"}, {"id": "c", "label": "40"}, {"id": "d", "label": "11"}]}', 'Count the 4 bundles of ten (40) plus 7 individual ones.', 1),
('11111111-1111-4111-8111-111111111102', 'ns_place_value_100', 'In the number 63, what digit is in the tens place?', 'numeric_input', '{"placeholder": "Type the digit"}', 'Look at the first digit on the left in a 2-digit number.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_solutions (question_id, correct_answer, explanation) VALUES
('11111111-1111-4111-8111-111111111101', '{"choice_id": "a", "value": "47"}', '4 tens is 40, and 7 ones is 7. 40 + 7 = 47.'),
('11111111-1111-4111-8111-111111111102', '{"value": "6"}', 'In 63, the 6 represents 6 tens (60), and the 3 represents 3 ones.')
ON CONFLICT (question_id) DO NOTHING;

-- Lesson: as_mental_addition_20
INSERT INTO public.questions (id, lesson_id, prompt, question_type, options, hint, order_index) VALUES
('22222222-2222-4222-8222-222222222201', 'as_mental_addition_20', 'What is 8 + 7?', 'multiple_choice', '{"choices": [{"id": "a", "label": "13"}, {"id": "b", "label": "15"}, {"id": "c", "label": "16"}, {"id": "d", "label": "14"}]}', 'Think: 8 + 2 makes 10, then add the remaining 5.', 1),
('22222222-2222-4222-8222-222222222202', 'as_mental_addition_20', 'Solve: 14 + 5 = ?', 'numeric_input', '{"placeholder": "Enter answer"}', 'Add 5 to 4 ones, keeping the 10 intact.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_solutions (question_id, correct_answer, explanation) VALUES
('22222222-2222-4222-8222-222222222201', '{"choice_id": "b", "value": "15"}', '8 + 7 = 15.'),
('22222222-2222-4222-8222-222222222202', '{"value": "19"}', '14 + 5 = 19.')
ON CONFLICT (question_id) DO NOTHING;

-- Lesson: md_arrays_intro
INSERT INTO public.questions (id, lesson_id, prompt, question_type, options, hint, order_index) VALUES
('33333333-3333-4333-8333-333333333301', 'md_arrays_intro', 'An array has 3 rows with 4 apples in each row. How many apples in total?', 'multiple_choice', '{"choices": [{"id": "a", "label": "7"}, {"id": "b", "label": "12"}, {"id": "c", "label": "10"}, {"id": "d", "label": "14"}]}', 'Multiply the number of rows by the count per row (3 x 4).', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_solutions (question_id, correct_answer, explanation) VALUES
('33333333-3333-4333-8333-333333333301', '{"choice_id": "b", "value": "12"}', '3 rows of 4 apples = 3 x 4 = 12 apples.')
ON CONFLICT (question_id) DO NOTHING;

-- Lesson: fr_halves_quarters
INSERT INTO public.questions (id, lesson_id, prompt, question_type, options, hint, order_index) VALUES
('44444444-4444-4444-8444-444444444401', 'fr_halves_quarters', 'A pizza is cut into 4 equal slices. If you eat 1 slice, what fraction of the pizza did you eat?', 'multiple_choice', '{"choices": [{"id": "a", "label": "1/2"}, {"id": "b", "label": "1/4"}, {"id": "c", "label": "3/4"}, {"id": "d", "label": "1/3"}]}', 'The denominator (bottom number) is the total slices: 4.', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_solutions (question_id, correct_answer, explanation) VALUES
('44444444-4444-4444-8444-444444444401', '{"choice_id": "b", "value": "1/4"}', '1 slice out of 4 equal slices is 1/4.')
ON CONFLICT (question_id) DO NOTHING;
