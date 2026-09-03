// Core Enum Types
export type AgeBand = 'age_7_8' | 'age_8_9' | 'age_9_10' | 'age_10_11';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType =
  | 'multiple_choice'
  | 'numeric_input'
  | 'visual_grid'
  | 'fraction_bars';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

// Child and Guardian Models
export interface GuardianProfile {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  guardianId: string;
  nickname: string;
  ageBand: AgeBand;
  avatarColor: string;
  createdAt: string;
}

// Curriculum Models
export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  orderIndex: number;
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  orderIndex: number;
}

export interface QuestionChoice {
  id: string;
  label: string;
}

export interface QuestionOptions {
  choices?: QuestionChoice[];
  placeholder?: string;
  gridRows?: number;
  gridCols?: number;
  totalBars?: number;
  filledBars?: number;
}

// Safe Question Definition (NEVER contains correct answers)
export interface Question {
  id: string;
  lessonId: string;
  prompt: string;
  questionType: QuestionType;
  options: QuestionOptions | null;
  hint: string;
  orderIndex: number;
}

// Learning Session & Attempt Models
export interface LearningSession {
  id: string;
  childId: string;
  lessonId: string;
  status: SessionStatus;
  idempotencyKey: string;
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface QuestionAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  attemptNumber: number;
  submittedAnswer: Record<string, unknown>;
  isCorrect: boolean;
  usedHint: boolean;
  durationMs: number;
  submittedAt: string;
}

// Scoring Microservice Contracts
export interface AttemptSummary {
  question_id: string;
  attempt_number: number;
  is_correct: boolean;
  used_hint: boolean;
  duration_ms: number;
  timestamp?: string;
}

export interface ScoreRequest {
  child_id: string;
  topic_id: string;
  attempts: AttemptSummary[];
}

export interface ScoreResponse {
  score: number;
  confidence: number;
  accuracy_rate: number;
  attempt_efficiency: number;
  pace_score: number;
  sample_count: number;
  is_sufficient_data: boolean;
  reason_codes: string[];
  algorithm_version: string;
}

export interface TopicMasterySnapshot {
  topic_id: string;
  score: number;
  confidence: number;
  sample_count: number;
}

export interface RecommendRequest {
  child_id: string;
  mastery_snapshots: TopicMasterySnapshot[];
  completed_lesson_ids: string[];
}

export interface RecommendResponse {
  recommended_topic_id: string;
  recommended_lesson_id: string;
  priority: number;
  explanation: string;
  reason_code: string;
  algorithm_version: string;
}

// API Route Payloads
export interface SubmitAttemptRequest {
  sessionId: string;
  childId: string;
  questionId: string;
  attemptNumber: number;
  submittedAnswer: {
    choiceId?: string;
    value?: string | number;
  };
  usedHint: boolean;
  durationMs: number;
}

export interface SubmitAttemptResponse {
  isCorrect: boolean;
  explanation: string;
  attemptNumber: number;
}

export interface CompleteSessionRequest {
  sessionId: string;
  childId: string;
  idempotencyKey: string;
}

export interface CompleteSessionResponse {
  sessionId: string;
  status: 'completed';
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number;
  masteryScore: ScoreResponse;
  recommendation: RecommendResponse;
}
