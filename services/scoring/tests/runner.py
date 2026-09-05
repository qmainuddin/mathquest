import sys
import os
import unittest

# Ensure service directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.test_engine import TestScoringEngine
from tests.test_recommender import TestTopicRecommender

def run_all_scoring_tests():
    suite = unittest.TestSuite()
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestScoringEngine))
    suite.addTest(unittest.TestLoader().loadTestsFromTestCase(TestTopicRecommender))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if not result.wasSuccessful():
        print(f"FAILED: {len(result.failures)} failures, {len(result.errors)} errors")
        sys.exit(1)
    else:
        print(f"ALL SCORING TESTS PASSED ({result.testsRun} test cases verified)")

if __name__ == "__main__":
    run_all_scoring_tests()
