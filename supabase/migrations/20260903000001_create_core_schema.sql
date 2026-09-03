-- Migration: 20260903000001_create_core_schema.sql
-- Description: Core schema tables for MathQuest

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Linked to auth.users for Guardians)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Children (Child profiles owned by guardian)
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 50),
    age_band TEXT NOT NULL CHECK (age_band IN ('age_7_8', 'age_8_9', 'age_9_10', 'age_10_11')),
    avatar_color TEXT NOT NULL DEFAULT 'blue',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_children_guardian ON public.children(guardian_id);

-- 3. Topics
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lessons_topic ON public.lessons(topic_id, order_index);

-- 5. Questions (Browser-safe questions: NO correct answers here!)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'numeric_input', 'visual_grid', 'fraction_bars')),
    options JSONB, -- list of choices for multiple choice, or visualization layout
    hint TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_lesson ON public.questions(lesson_id, order_index);

-- 6. Question Solutions (RESTRICTED: Never exposed to client tokens)
CREATE TABLE IF NOT EXISTS public.question_solutions (
    question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
    correct_answer JSONB NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Learning Sessions
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
    idempotency_key TEXT UNIQUE NOT NULL,
    total_questions INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_child ON public.learning_sessions(child_id);

-- 8. Question Attempts
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL CHECK (attempt_number >= 1),
    submitted_answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    used_hint BOOLEAN NOT NULL DEFAULT false,
    duration_ms INT NOT NULL CHECK (duration_ms >= 0),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_session_question_attempt UNIQUE (session_id, question_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.question_attempts(session_id);

-- 9. Mastery Scores
CREATE TABLE IF NOT EXISTS public.mastery_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    accuracy_rate NUMERIC(5,2) NOT NULL CHECK (accuracy_rate >= 0 AND accuracy_rate <= 1),
    algorithm_version TEXT NOT NULL,
    reason_codes TEXT[] NOT NULL DEFAULT '{}',
    sample_count INT NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_child_topic_mastery UNIQUE (child_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_mastery_child ON public.mastery_scores(child_id);

-- 10. Practice Recommendations
CREATE TABLE IF NOT EXISTS public.practice_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    recommended_topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    recommended_lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    priority INT NOT NULL DEFAULT 1,
    explanation TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_child_recommendation UNIQUE (child_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_child ON public.practice_recommendations(child_id);
