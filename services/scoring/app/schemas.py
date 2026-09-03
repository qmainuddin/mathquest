from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class AttemptSummary(BaseModel):
    question_id: str
    attempt_number: int = Field(ge=1, description="Attempt number starting at 1")
    is_correct: bool
    used_hint: bool = False
    duration_ms: int = Field(ge=0, description="Response duration in milliseconds")
    timestamp: Optional[str] = None

class ScoreRequest(BaseModel):
    child_id: str
    topic_id: str
    attempts: List[AttemptSummary]

class ScoreResponse(BaseModel):
    score: float = Field(ge=0.0, le=100.0)
    confidence: float = Field(ge=0.0, le=1.0)
    accuracy_rate: float = Field(ge=0.0, le=1.0)
    attempt_efficiency: float = Field(ge=0.0, le=1.0)
    pace_score: float = Field(ge=0.0, le=1.0)
    sample_count: int = Field(ge=0)
    is_sufficient_data: bool
    reason_codes: List[str]
    algorithm_version: str

class TopicMasterySnapshot(BaseModel):
    topic_id: str
    score: float
    confidence: float
    sample_count: int

class RecommendRequest(BaseModel):
    child_id: str
    mastery_snapshots: List[TopicMasterySnapshot]
    completed_lesson_ids: List[str] = []

class RecommendResponse(BaseModel):
    recommended_topic_id: str
    recommended_lesson_id: str
    priority: int
    explanation: str
    reason_code: str
    algorithm_version: str

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    port: int
