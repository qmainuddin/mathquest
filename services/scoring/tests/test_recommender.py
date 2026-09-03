import pytest
from app.schemas import RecommendRequest, TopicMasterySnapshot
from app.recommender import TopicRecommender

@pytest.fixture
def recommender():
    return TopicRecommender()

def test_initial_recommendation_is_foundation(recommender):
    # Child with no scores should be recommended number_sense
    req = RecommendRequest(child_id="child-1", mastery_snapshots=[])
    res = recommender.recommend_next(req)
    assert res.recommended_topic_id == "number_sense"
    assert res.reason_code == "TOPIC_PREREQUISITES_SATISFIED"

def test_prerequisite_gating(recommender):
    # Child has low number_sense (<60). Should NOT unlock addition_subtraction.
    req = RecommendRequest(
        child_id="child-1",
        mastery_snapshots=[
            TopicMasterySnapshot(topic_id="number_sense", score=45.0, confidence=0.8, sample_count=10)
        ],
    )
    res = recommender.recommend_next(req)
    assert res.recommended_topic_id == "number_sense"
    assert res.reason_code == "LOWEST_CONFIDENCE_ADJUSTED_MASTERY"

def test_unlocks_next_topic_when_prerequisite_met(recommender):
    # Child mastered number_sense (score 85). Should be recommended addition_subtraction!
    req = RecommendRequest(
        child_id="child-1",
        mastery_snapshots=[
            TopicMasterySnapshot(topic_id="number_sense", score=85.0, confidence=1.0, sample_count=15)
        ],
    )
    res = recommender.recommend_next(req)
    assert res.recommended_topic_id == "addition_subtraction"
    assert res.reason_code == "TOPIC_PREREQUISITES_SATISFIED"

def test_recommends_lowest_mastery_among_unlocked(recommender):
    # Child has unlocked multiplication, but addition mastery dropped to 62
    req = RecommendRequest(
        child_id="child-1",
        mastery_snapshots=[
            TopicMasterySnapshot(topic_id="number_sense", score=90.0, confidence=1.0, sample_count=15),
            TopicMasterySnapshot(topic_id="addition_subtraction", score=62.0, confidence=0.9, sample_count=12),
            TopicMasterySnapshot(topic_id="multiplication_division", score=78.0, confidence=0.8, sample_count=10),
        ],
    )
    res = recommender.recommend_next(req)
    assert res.recommended_topic_id == "addition_subtraction"
    assert res.reason_code == "LOWEST_CONFIDENCE_ADJUSTED_MASTERY"
