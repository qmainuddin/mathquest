from fastapi import FastAPI, Depends
from app.config import settings
from app.schemas import (
    ScoreRequest,
    ScoreResponse,
    RecommendRequest,
    RecommendResponse,
    HealthResponse,
)
from app.engine import scoring_engine
from app.recommender import recommender
from app.middleware import CorrelationIdMiddleware, verify_internal_secret

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Deterministic scoring and recommendation microservice for MathQuest",
)

# Attach Correlation ID middleware
app.add_middleware(CorrelationIdMiddleware)

@app.get("/healthz", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Unauthenticated health check endpoint for Docker and Caddy."""
    return HealthResponse(
        status="healthy",
        service="mathquest-scoring",
        version=settings.version,
        port=settings.port,
    )

@app.post(
    "/v1/score",
    response_model=ScoreResponse,
    dependencies=[Depends(verify_internal_secret)],
    tags=["Scoring"],
)
async def score_attempts(request: ScoreRequest):
    """
    Computes deterministic mastery scores:
    - 70% accuracy
    - 20% attempt efficiency
    - 10% pace (capped)
    """
    return scoring_engine.calculate_score(
        child_id=request.child_id,
        topic_id=request.topic_id,
        attempts=request.attempts,
    )

@app.post(
    "/v1/recommend",
    response_model=RecommendResponse,
    dependencies=[Depends(verify_internal_secret)],
    tags=["Recommendations"],
)
async def recommend_next_practice(request: RecommendRequest):
    """
    Recommends the child's next topic and lesson based on prerequisite hierarchy
    and confidence-adjusted mastery scores.
    """
    return recommender.recommend_next(request)
