-- Migration: 20260903000003_secure_question_answers.sql
-- Description: Server-side answer evaluation and child data cleanup functions

-- Function: Server-side answer evaluation (SECURITY DEFINER)
-- Allows Next.js server to evaluate answers without exposing solution keys to clients
CREATE OR REPLACE FUNCTION public.evaluate_question_answer(
    p_question_id UUID,
    p_submitted_answer JSONB
)
RETURNS TABLE (
    is_correct BOOLEAN,
    explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_correct_answer JSONB;
    v_explanation TEXT;
    v_is_correct BOOLEAN;
BEGIN
    SELECT correct_answer, explanation
    INTO v_correct_answer, v_explanation
    FROM public.question_solutions
    WHERE question_id = p_question_id;

    IF v_correct_answer IS NULL THEN
        RAISE EXCEPTION 'Question solution not found for question %', p_question_id;
    END IF;

    -- Compare submitted answer with correct answer (JSON equality or numeric normalization)
    IF p_submitted_answer = v_correct_answer THEN
        v_is_correct := true;
    ELSIF p_submitted_answer->>'value' = v_correct_answer->>'value' THEN
        v_is_correct := true;
    ELSE
        v_is_correct := false;
    END IF;

    RETURN QUERY SELECT v_is_correct, v_explanation;
END;
$$;

-- Function: Cascade child data deletion (COPPA / GDPR-K compliant)
CREATE OR REPLACE FUNCTION public.delete_child_data(
    p_child_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_guardian_id UUID;
BEGIN
    -- Verify caller owns the child
    SELECT guardian_id INTO v_guardian_id
    FROM public.children
    WHERE id = p_child_id;

    IF v_guardian_id IS NULL OR v_guardian_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied: Caller does not own child %', p_child_id;
    END IF;

    -- Cascade delete all child data (attempts, sessions, mastery scores, recommendations)
    DELETE FROM public.children WHERE id = p_child_id;

    RETURN true;
END;
$$;
