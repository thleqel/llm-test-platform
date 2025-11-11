"""
Full integration tests for DeepEval Service
"""

import time
import requests
from tests.utils import ServiceTestHelper, print_test_result


class IntegrationTestSuite:
    """Complete integration test suite"""
    
    def __init__(self):
        self.helper = ServiceTestHelper()
        self.passed = 0
        self.failed = 0
        self.skipped = 0
    
    def run_test(self, test_name: str, test_func):
        """Run a test and track results"""
        try:
            result = test_func()
            if result:
                print_test_result(test_name, True)
                self.passed += 1
            else:
                print_test_result(test_name, False)
                self.failed += 1
        except Exception as e:
            print_test_result(test_name, False, f"Exception: {str(e)}")
            self.failed += 1
    
    def skip_test(self, test_name: str, reason: str):
        """Skip a test"""
        print_test_result(f"{test_name} (SKIPPED)", True, reason)
        self.skipped += 1
    
    def test_service_health(self) -> bool:
        """Test service health"""
        return self.helper.is_service_healthy()
    
    def test_ollama_health(self) -> bool:
        """Test Ollama health"""
        return self.helper.is_ollama_healthy()
    
    def test_get_metrics(self) -> bool:
        """Test get metrics endpoint"""
        metrics = self.helper.get_metrics()
        if not metrics:
            return False
        
        return (
            "metrics" in metrics and
            "total_metrics" in metrics and
            len(metrics["metrics"]) > 0
        )
    
    def test_get_providers(self) -> bool:
        """Test get providers endpoint"""
        providers = self.helper.get_providers()
        if not providers:
            return False
        
        return (
            "providers" in providers and
            "total_providers" in providers and
            len(providers["providers"]) > 0
        )
    
    def test_single_evaluation_basic(self) -> bool:
        """Test basic single evaluation"""
        payload = {
            "input": "What is 2+2?",
            "actual_output": "4"
        }
        
        response = self.helper.evaluate_single(payload)
        if response.status_code != 200:
            return False
        
        data = response.json()
        return (
            "result" in data and
            "status" in data and
            "metrics" in data["result"] and
            "answer_relevancy" in data["result"]["metrics"]
        )
    
    def test_single_evaluation_complete(self) -> bool:
        """Test complete single evaluation"""
        payload = {
            "input": "What is the capital of France?",
            "actual_output": "The capital of France is Paris.",
            "expected_output": "Paris",
            "retrieval_context": [
                "France is a country in Western Europe.",
                "Paris is the largest city in France."
            ],
            "metrics": ["answer_relevancy", "faithfulness", "correctness"],
            "model_configuration": {
                "provider": "ollama",
                "model_name": "llama3.1:8b",
                "temperature": 0.0
            }
        }
        
        response = self.helper.evaluate_single(payload)
        if response.status_code != 200:
            return False
        
        data = response.json()
        metrics = data["result"]["metrics"]
        
        # Should have multiple metrics
        return len(metrics) >= 2 and "model_used" in data["result"]
    
    def test_threshold_functionality(self) -> bool:
        """Test custom threshold functionality"""
        payload_low = {
            "input": "What is AI?",
            "actual_output": "AI is artificial intelligence.",
            "metrics": ["answer_relevancy"],
            "metric_kwargs": {"threshold": 0.2}
        }
        
        payload_high = {
            "input": "What is AI?",
            "actual_output": "AI is artificial intelligence.",
            "metrics": ["answer_relevancy"],
            "metric_kwargs": {"threshold": 0.9}
        }
        
        response_low = self.helper.evaluate_single(payload_low)
        response_high = self.helper.evaluate_single(payload_high)
        
        if response_low.status_code != 200 or response_high.status_code != 200:
            return False
        
        data_low = response_low.json()
        data_high = response_high.json()
        
        score_low = data_low["result"]["metrics"]["answer_relevancy"]["score"]
        score_high = data_high["result"]["metrics"]["answer_relevancy"]["score"]
        
        # Scores should be identical
        return abs(score_low - score_high) < 0.001
    
    def test_batch_evaluation(self) -> bool:
        """Test batch evaluation"""
        payload = {
            "test_cases": [
                {
                    "input": "What is 1+1?",
                    "actual_output": "2",
                    "expected_output": "2"
                },
                {
                    "input": "What is the capital of Spain?",
                    "actual_output": "Madrid",
                    "expected_output": "Madrid"
                }
            ],
            "metrics": ["answer_relevancy", "correctness"]
        }
        
        response = self.helper.evaluate_batch(payload)
        if response.status_code != 200:
            return False
        
        data = response.json()
        return (
            "results" in data and
            "total_cases" in data and
            len(data["results"]) == 2 and
            data["total_cases"] == 2
        )
    
    def test_error_handling(self) -> bool:
        """Test error handling"""
        # Test invalid metric
        payload = {
            "input": "Test",
            "actual_output": "Test",
            "metrics": ["invalid_metric"]
        }
        
        response = self.helper.evaluate_single(payload)
        # Should return 400 or 500 error
        return response.status_code >= 400
    
    def test_model_configuration(self) -> bool:
        """Test custom model configuration"""
        payload = {
            "input": "What is machine learning?",
            "actual_output": "ML is a subset of AI.",
            "metrics": ["answer_relevancy"],
            "model_configuration": {
                "provider": "ollama",
                "model_name": "llama3.1:8b",
                "temperature": 0.1,
                "timeout": 120
            }
        }
        
        response = self.helper.evaluate_single(payload)
        if response.status_code != 200:
            return False
        
        data = response.json()
        model_used = data["result"]["model_used"]
        return (
            model_used["provider"] == "ollama" and
            model_used["model_name"] == "llama3.1:8b"
        )
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 DeepEval Service - Complete Integration Test Suite")
        print("=" * 60)
        print()
        
        # Prerequisites
        print("📋 Prerequisites Check:")
        self.run_test("Service Health", self.test_service_health)
        
        if not self.helper.is_service_healthy():
            print("\n❌ Service is not running. Please start with: docker-compose up")
            return False
        
        self.run_test("Ollama Health", self.test_ollama_health)
        print()
        
        # API Endpoints
        print("🔌 API Endpoints:")
        self.run_test("Get Metrics", self.test_get_metrics)
        self.run_test("Get Providers", self.test_get_providers)
        print()
        
        # Evaluation Tests
        print("🧪 Evaluation Functionality:")
        self.run_test("Basic Single Evaluation", self.test_single_evaluation_basic)
        self.run_test("Complete Single Evaluation", self.test_single_evaluation_complete)
        self.run_test("Batch Evaluation", self.test_batch_evaluation)
        print()
        
        # Advanced Features
        print("⚙️ Advanced Features:")
        self.run_test("Threshold Functionality", self.test_threshold_functionality)
        self.run_test("Model Configuration", self.test_model_configuration)
        self.run_test("Error Handling", self.test_error_handling)
        print()
        
        # Results Summary
        total = self.passed + self.failed + self.skipped
        print("📊 Test Results Summary:")
        print(f"   Total Tests: {total}")
        print(f"   ✅ Passed: {self.passed}")
        print(f"   ❌ Failed: {self.failed}")
        print(f"   ⏭️ Skipped: {self.skipped}")
        print(f"   Success Rate: {(self.passed/total)*100:.1f}%" if total > 0 else "   Success Rate: 0%")
        
        if self.failed == 0:
            print("\n🎉 All tests passed! The service is working correctly.")
            return True
        else:
            print(f"\n⚠️ {self.failed} test(s) failed. Check the service configuration and logs.")
            return False


def main():
    """Run integration tests"""
    suite = IntegrationTestSuite()
    success = suite.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())