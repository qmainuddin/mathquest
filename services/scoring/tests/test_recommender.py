import unittest
from app.schemas import RecommendRequest, TopicMasterySnapshot
from app.recommender import TopicRecommender


class TestTopicRecommender(unittest.TestCase):
    """Test suite for curriculum topic recommender engine."""

    def setUp(self):
        self.recommender = TopicRecommender()

    def test_initial_recommendation_is_foundation(self):
        # Child with no scores should be recommended number_sense
        req = RecommendRequest(child_id="child-1", mastery_snapshots=[])
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "number_sense")
        self.assertEqual(res.reason_code, "TOPIC_PREREQUISITES_SATISFIED")

    def test_prerequisite_gating(self):
        # Child has low number_sense (<60). Should NOT unlock addition_subtraction.
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=45.0, confidence=0.8, sample_count=10)
            ],
        )
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "number_sense")
        self.assertEqual(res.reason_code, "LOWEST_CONFIDENCE_ADJUSTED_MASTERY")

    def test_unlocks_next_topic_when_prerequisite_met(self):
        # Child mastered number_sense (score 85). Should be recommended addition_subtraction!
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=85.0, confidence=1.0, sample_count=15)
            ],
        )
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "addition_subtraction")
        self.assertEqual(res.reason_code, "TOPIC_PREREQUISITES_SATISFIED")

    def test_recommends_lowest_mastery_among_unlocked(self):
        # Child has unlocked all topics, and addition mastery is lowest at 62
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=90.0, confidence=1.0, sample_count=15),
                TopicMasterySnapshot(topic_id="addition_subtraction", score=62.0, confidence=0.9, sample_count=12),
                TopicMasterySnapshot(topic_id="multiplication_division", score=78.0, confidence=0.8, sample_count=10),
                TopicMasterySnapshot(topic_id="fractions", score=82.0, confidence=0.8, sample_count=8),
            ],
        )
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "addition_subtraction")
        self.assertEqual(res.reason_code, "LOWEST_CONFIDENCE_ADJUSTED_MASTERY")

    def test_recommends_new_unlocked_topic_when_ready(self):
        # Child mastered multiplication (78) and number_sense (90), so fractions is ready to unlock
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=90.0, confidence=1.0, sample_count=15),
                TopicMasterySnapshot(topic_id="addition_subtraction", score=85.0, confidence=1.0, sample_count=12),
                TopicMasterySnapshot(topic_id="multiplication_division", score=78.0, confidence=0.8, sample_count=10),
            ],
        )
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "fractions")
        self.assertEqual(res.reason_code, "TOPIC_PREREQUISITES_SATISFIED")

    def test_fractions_prerequisite_gating(self):
        # Fractions requires multiplication_division >= 60.0 and number_sense >= 60.0
        # If multiplication is 50.0, fractions should NOT be unlocked
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=80.0, confidence=1.0, sample_count=10),
                TopicMasterySnapshot(topic_id="addition_subtraction", score=75.0, confidence=1.0, sample_count=10),
                TopicMasterySnapshot(topic_id="multiplication_division", score=50.0, confidence=0.9, sample_count=8),
            ],
        )
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "multiplication_division")

    def test_all_topics_mastered_returns_valid_recommendation(self):
        # Child has mastered all 4 topics with scores > 85.0
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=95.0, confidence=1.0, sample_count=20),
                TopicMasterySnapshot(topic_id="addition_subtraction", score=92.0, confidence=1.0, sample_count=20),
                TopicMasterySnapshot(topic_id="multiplication_division", score=88.0, confidence=1.0, sample_count=20),
                TopicMasterySnapshot(topic_id="fractions", score=86.0, confidence=1.0, sample_count=20),
            ],
        )
        res = self.recommender.recommend_next(req)
        # Lowest confidence-adjusted score among all is fractions (86.0)
        self.assertEqual(res.recommended_topic_id, "fractions")
        self.assertIn("boost your mastery", res.explanation)
        self.assertEqual(res.reason_code, "LOWEST_CONFIDENCE_ADJUSTED_MASTERY")

    def test_lesson_id_matches_topic_first_lesson(self):
        req = RecommendRequest(
            child_id="child-1",
            mastery_snapshots=[
                TopicMasterySnapshot(topic_id="number_sense", score=85.0, confidence=1.0, sample_count=10),
            ],
        )
        res = self.recommender.recommend_next(req)
        self.assertEqual(res.recommended_topic_id, "addition_subtraction")
        self.assertEqual(res.recommended_lesson_id, "as_mental_addition_20")


if __name__ == "__main__":
    unittest.main()
