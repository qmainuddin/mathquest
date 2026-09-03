from typing import List, Dict
from app.schemas import RecommendRequest, RecommendResponse, TopicMasterySnapshot

TOPIC_PREREQUISITES = {
    "number_sense": [],
    "addition_subtraction": ["number_sense"],
    "multiplication_division": ["addition_subtraction"],
    "fractions": ["multiplication_division", "number_sense"],
}

TOPIC_FIRST_LESSONS = {
    "number_sense": "ns_place_value_100",
    "addition_subtraction": "as_mental_addition_20",
    "multiplication_division": "md_arrays_intro",
    "fractions": "fr_halves_quarters",
}

TOPIC_NAMES = {
    "number_sense": "Number Sense & Place Value",
    "addition_subtraction": "Addition & Subtraction",
    "multiplication_division": "Multiplication & Division",
    "fractions": "Introductory Fractions",
}

class TopicRecommender:
    VERSION = "recommender_v1.0.0"
    MASTERY_THRESHOLD = 75.0

    def recommend_next(self, request: RecommendRequest) -> RecommendResponse:
        scores_by_topic: Dict[str, TopicMasterySnapshot] = {
            s.topic_id: s for s in request.mastery_snapshots
        }

        # Check topics in logical curriculum sequence
        candidates = []
        for topic_id, prereqs in TOPIC_PREREQUISITES.items():
            # Check prerequisites met
            prereqs_met = True
            for p in prereqs:
                p_snapshot = scores_by_topic.get(p)
                if not p_snapshot or p_snapshot.score < 60.0:
                    prereqs_met = False
                    break

            if not prereqs_met:
                continue

            snapshot = scores_by_topic.get(topic_id)
            if not snapshot:
                # Brand new topic that child is ready for!
                candidates.append((0.0, 0.0, topic_id, "NEW_TOPIC_READY"))
            else:
                # Confidence-adjusted score: lower score + higher confidence = needs practice
                adjusted_score = snapshot.score * (0.5 + 0.5 * snapshot.confidence)
                candidates.append((adjusted_score, snapshot.score, topic_id, "NEEDS_PRACTICE"))

        if not candidates:
            # Fallback to foundation
            target_topic = "number_sense"
            explanation = "Let's build a rock-solid foundation with Number Sense puzzles!"
            reason_code = "FOUNDATION_FALLBACK"
        else:
            # Sort by lowest adjusted score
            candidates.sort(key=lambda x: x[0])
            best = candidates[0]
            target_topic = best[2]
            reason = best[3]

            topic_title = TOPIC_NAMES.get(target_topic, target_topic)
            if reason == "NEW_TOPIC_READY":
                explanation = f"You are ready to unlock exciting new adventures in {topic_title}!"
                reason_code = "TOPIC_PREREQUISITES_SATISFIED"
            else:
                explanation = f"A little more practice in {topic_title} will boost your mastery to the top!"
                reason_code = "LOWEST_CONFIDENCE_ADJUSTED_MASTERY"

        recommended_lesson = TOPIC_FIRST_LESSONS.get(target_topic, f"{target_topic}_intro")

        return RecommendResponse(
            recommended_topic_id=target_topic,
            recommended_lesson_id=recommended_lesson,
            priority=1,
            explanation=explanation,
            reason_code=reason_code,
            algorithm_version=self.VERSION,
        )

recommender = TopicRecommender()
