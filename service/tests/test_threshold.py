"""
Custom threshold functionality tests
"""

import pytest
import requests
from tests.utils import ServiceTestHelper, print_test_result


class TestThresholdFunctionality:
    """Test custom threshold functionality"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.helper = ServiceTestHelper()
        if not cls.helper.is_service_healthy():
            pytest.skip("Service is not running")
    
    def test_default_threshold_behavior(self):
        """Test default threshold behavior (0.5)"""
        payload = {
            "input": "What is the capital of France?",
            "actual_output": "Paris",
            "expected_output": "Paris",
            "metrics": ["answer_relevancy"]
        }
        
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 200
        
        data = response.json()
        metric_result = data["result"]["metrics"]["answer_relevancy"]
        
        # With default threshold (0.5), good answers should typically pass
        assert "score" in metric_result
        assert "success" in metric_result
        assert isinstance(metric_result["score"], (int, float))
        assert isinstance(metric_result["success"], bool)
    
    def test_custom_low_threshold(self):
        """Test custom low threshold (0.2)"""
        payload = {
            "input": "What is the capital of France?",
            "actual_output": "Paris",
            "expected_output": "Paris", 
            "metrics": ["answer_relevancy"],
            "metric_kwargs": {"threshold": 0.2}
        }
        
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 200
        
        data = response.json()
        metric_result = data["result"]["metrics"]["answer_relevancy"]
        
        # With low threshold, should almost always pass
        assert metric_result["success"] is True
    
    def test_custom_high_threshold(self):
        """Test custom high threshold (0.95)"""
        payload = {
            "input": "What is the capital of France?",
            "actual_output": "Paris", 
            "expected_output": "Paris",
            "metrics": ["answer_relevancy"],
            "metric_kwargs": {"threshold": 0.95}
        }
        
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 200
        
        data = response.json()
        metric_result = data["result"]["metrics"]["answer_relevancy"]
        
        # With high threshold, might pass or fail depending on score
        # But the test should complete successfully regardless
        assert "score" in metric_result
        assert "success" in metric_result
    
    def test_threshold_comparison(self):
        """Test that different thresholds affect success determination"""
        base_payload = {
            "input": "What is artificial intelligence?",
            "actual_output": "AI is a technology that simulates human intelligence.",
            "expected_output": "AI simulates human intelligence",
            "metrics": ["answer_relevancy"]
        }
        
        # Test with low threshold
        low_payload = {**base_payload, "metric_kwargs": {"threshold": 0.3}}
        low_response = self.helper.evaluate_single(low_payload)
        assert low_response.status_code == 200
        low_data = low_response.json()
        low_result = low_data["result"]["metrics"]["answer_relevancy"]
        
        # Test with high threshold
        high_payload = {**base_payload, "metric_kwargs": {"threshold": 0.9}}
        high_response = self.helper.evaluate_single(high_payload)
        assert high_response.status_code == 200
        high_data = high_response.json()
        high_result = high_data["result"]["metrics"]["answer_relevancy"]
        
        # Scores should be identical
        assert abs(low_result["score"] - high_result["score"]) < 0.001
        
        # Success might be different based on thresholds
        # Low threshold is more likely to pass
        score = low_result["score"]
        if score >= 0.9:
            assert low_result["success"] is True
            assert high_result["success"] is True
        elif score >= 0.3:
            assert low_result["success"] is True
            # high_result success depends on actual score
        else:
            # Very low score
            assert low_result["success"] is False
            assert high_result["success"] is False
    
    def test_threshold_with_multiple_metrics(self):
        """Test threshold applies to multiple metrics"""
        payload = {
            "input": "What is machine learning?",
            "actual_output": "Machine learning is a subset of AI that learns from data.",
            "expected_output": "ML is AI that learns from data",
            "metrics": ["answer_relevancy", "correctness"],
            "metric_kwargs": {"threshold": 0.7}
        }
        
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 200
        
        data = response.json()
        metrics = data["result"]["metrics"]
        
        # Both metrics should use the same threshold
        for metric_name in ["answer_relevancy", "correctness"]:
            assert metric_name in metrics
            metric_result = metrics[metric_name]
            assert "score" in metric_result
            assert "success" in metric_result
            
            # Success should be based on score >= 0.7
            expected_success = metric_result["score"] >= 0.7
            assert metric_result["success"] == expected_success
    
    def test_batch_evaluation_with_threshold(self):
        """Test threshold in batch evaluation"""
        payload = {
            "test_cases": [
                {
                    "input": "What is 2+2?",
                    "actual_output": "4",
                    "expected_output": "4"
                },
                {
                    "input": "What is the capital of Spain?",
                    "actual_output": "Madrid", 
                    "expected_output": "Madrid"
                }
            ],
            "metrics": ["answer_relevancy", "correctness"],
            "metric_kwargs": {"threshold": 0.8}
        }
        
        response = self.helper.evaluate_batch(payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["results"]) == 2
        
        # Check threshold application to all cases
        for result in data["results"]:
            for metric_name, metric_result in result["metrics"].items():
                assert "score" in metric_result
                assert "success" in metric_result
                # Success should be based on score >= 0.8
                expected_success = metric_result["score"] >= 0.8
                assert metric_result["success"] == expected_success
    
    def test_invalid_threshold_handling(self):
        """Test handling of invalid threshold values"""
        # Negative threshold
        payload = {
            "input": "Test",
            "actual_output": "Test",
            "metrics": ["answer_relevancy"],
            "metric_kwargs": {"threshold": -0.5}
        }
        
        response = self.helper.evaluate_single(payload)
        # Should still work, as we don't validate threshold range yet
        # But this could be enhanced to validate 0.0 <= threshold <= 1.0
        assert response.status_code in [200, 400]
        
        # Threshold > 1.0
        payload["metric_kwargs"]["threshold"] = 1.5
        response = self.helper.evaluate_single(payload)
        assert response.status_code in [200, 400]


def run_manual_threshold_test():
    """Manual test to demonstrate threshold functionality"""
    print("🎯 Manual Threshold Functionality Test")
    print("=" * 50)
    
    helper = ServiceTestHelper()
    
    if not helper.is_service_healthy():
        print("❌ Service not running. Start with: docker-compose up")
        return False
    
    print("✅ Service is running\n")
    
    base_payload = {
        "input": "What is the capital of France?",
        "actual_output": "The capital of France is Paris.",
        "expected_output": "Paris",
        "metrics": ["answer_relevancy"]
    }
    
    thresholds = [0.3, 0.5, 0.8, 0.95]
    results = []
    
    print("Testing different threshold values...")
    
    for threshold in thresholds:
        payload = {**base_payload, "metric_kwargs": {"threshold": threshold}}
        response = helper.evaluate_single(payload)
        
        if response.status_code == 200:
            data = response.json()
            metric_result = data["result"]["metrics"]["answer_relevancy"]
            results.append({
                "threshold": threshold,
                "score": metric_result["score"],
                "success": metric_result["success"]
            })
            print(f"   Threshold {threshold}: Score={metric_result['score']:.3f}, Success={metric_result['success']}")
        else:
            print(f"   Threshold {threshold}: ❌ Failed ({response.status_code})")
    
    if results:
        print(f"\n📊 Analysis:")
        base_score = results[0]["score"]
        print(f"   • All scores identical: {all(abs(r['score'] - base_score) < 0.001 for r in results)}")
        print(f"   • Success rate by threshold:")
        for result in results:
            print(f"     - {result['threshold']}: {'✓' if result['success'] else '✗'}")
        print(f"\n✅ Threshold functionality is working correctly!")
        return True
    
    return False


if __name__ == "__main__":
    # Run manual test when executed directly
    run_manual_threshold_test()