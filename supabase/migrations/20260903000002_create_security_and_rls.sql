-- Migration: 20260903000002_create_security_and_rls.sql
-- Description: Row Level Security (RLS) and multi-tenant policies

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_recommendations ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Children Policies (Guardian ownership)
CREATE POLICY "Guardians can view own children"
    ON public.children FOR SELECT
    USING (guardian_id = auth.uid());

CREATE POLICY "Guardians can create child profiles"
    ON public.children FOR INSERT
    WITH CHECK (guardian_id = auth.uid());

CREATE POLICY "Guardians can update own children"
    ON public.children FOR UPDATE
    USING (guardian_id = auth.uid());

CREATE POLICY "Guardians can delete own children"
    ON public.children FOR DELETE
    USING (guardian_id = auth.uid());

-- 3. Content Policies (Read-Only for Everyone)
CREATE POLICY "Topics are publicly readable"
    ON public.topics FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Lessons are publicly readable"
    ON public.lessons FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Questions are publicly readable"
    ON public.questions FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Question Solutions (STRICT: Never accessible to client roles)
-- No SELECT policy for anon or authenticated. Only service_role can select.

-- 5. Learning Sessions Policies
CREATE POLICY "Guardians can view their children's sessions"
    ON public.learning_sessions FOR SELECT
    USING (
        child_id IN (
            SELECT id FROM public.children WHERE guardian_id = auth.uid()
        )
    );

CREATE POLICY "Guardians can create learning sessions for their children"
    ON public.learning_sessions FOR INSERT
    WITH CHECK (
        child_id IN (
            SELECT id FROM public.children WHERE guardian_id = auth.uid()
        )
    );

CREATE POLICY "Guardians can update learning sessions for their children"
    ON public.learning_sessions FOR UPDATE
    USING (
        child_id IN (
            SELECT id FROM public.children WHERE guardian_id = auth.uid()
        )
    );

-- 6. Question Attempts Policies
CREATE POLICY "Guardians can view their children's attempts"
    ON public.question_attempts FOR SELECT
    USING (
        session_id IN (
            SELECT ls.id FROM public.learning_sessions ls
            JOIN public.children c ON c.id = ls.child_id
            WHERE c.guardian_id = auth.uid()
        )
    );

CREATE POLICY "Guardians can submit attempts for their children's sessions"
    ON public.question_attempts FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT ls.id FROM public.learning_sessions ls
            JOIN public.children c ON c.id = ls.child_id
            WHERE c.guardian_id = auth.uid()
        )
    );

-- 7. Mastery Scores Policies (Read-only for clients, write restricted to service_role)
CREATE POLICY "Guardians can view their children's mastery scores"
    ON public.mastery_scores FOR SELECT
    USING (
        child_id IN (
            SELECT id FROM public.children WHERE guardian_id = auth.uid()
        )
    );

-- 8. Practice Recommendations Policies (Read-only for clients, write restricted to service_role)
CREATE POLICY "Guardians can view their children's recommendations"
    ON public.practice_recommendations FOR SELECT
    USING (
        child_id IN (
            SELECT id FROM public.children WHERE guardian_id = auth.uid()
        )
    );
