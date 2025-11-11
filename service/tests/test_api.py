"""
API endpoint tests for DeepEval Service
"""

import pytest
import requests
from tests.utils import (
    ServiceTestHelper, 
    SAMPLE_PAYLOADS,
    EXPECTED_SINGLE_RESPONSE_KEYS,
    EXPECTED_BATCH_RESPONSE_KEYS,
    EXPECTED_RESULT_KEYS,
    validate_response_schema,
    validate_metric_result
)


class TestAPIEndpoints:
    """Test class for API endpoints"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        cls.helper = ServiceTestHelper()
        if not cls.helper.is_service_healthy():
            pytest.skip("Service is not running")
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get("http://localhost:8001/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = requests.get("http://localhost:8001/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs" in data
    
    def test_get_metrics_endpoint(self):
        """Test get available metrics endpoint"""
        response = requests.get("http://localhost:8001/api/v1/evaluation/metrics")
        assert response.status_code == 200
        data = response.json()
        
        assert "metrics" in data
        assert "total_metrics" in data
        assert isinstance(data["metrics"], list)
        assert len(data["metrics"]) > 0
        
        # Check metric structure
        for metric in data["metrics"]:
            assert "name" in metric
            assert "description" in metric
            assert isinstance(metric["name"], str)
            assert isinstance(metric["description"], str)
    
    def test_get_providers_endpoint(self):
        """Test get available providers endpoint"""
        response = requests.get("http://localhost:8001/api/v1/evaluation/providers")
        assert response.status_code == 200
        data = response.json()
        
        assert "providers" in data
        assert "total_providers" in data
        assert isinstance(data["providers"], list)
        assert len(data["providers"]) > 0
        
        # Check provider structure
        for provider in data["providers"]:
            assert "name" in provider
            assert "description" in provider
            assert "available" in provider
            assert "required_fields" in provider
            assert "optional_fields" in provider
    
    def test_single_evaluation_minimal(self):
        """Test single evaluation with minimal payload"""
        response = self.helper.evaluate_single(SAMPLE_PAYLOADS["minimal_single"])
        assert response.status_code == 200
        
        data = response.json()
        assert validate_response_schema(data, EXPECTED_SINGLE_RESPONSE_KEYS)
        assert validate_response_schema(data["result"], EXPECTED_RESULT_KEYS)
        
        # Check metrics structure
        for metric_name, metric_result in data["result"]["metrics"].items():
            assert validate_metric_result(metric_result)
    
    def test_single_evaluation_complete(self):
        """Test single evaluation with complete payload"""
        response = self.helper.evaluate_single(SAMPLE_PAYLOADS["complete_single"])
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] in ["success", "partial_failure"]
        assert "model_used" in data["result"]
        assert data["result"]["model_used"]["provider"] == "ollama"
    
    def test_single_evaluation_with_threshold(self):
        """Test single evaluation with custom threshold"""
        response = self.helper.evaluate_single(SAMPLE_PAYLOADS["with_threshold"])
        assert response.status_code == 200
        
        data = response.json()
        assert response.status_code == 200
        # The threshold should affect success determination
        for metric_name, metric_result in data["result"]["metrics"].items():
            assert validate_metric_result(metric_result)
    
    def test_rag_evaluation(self):
        """Test RAG evaluation with context"""
        # RAG evaluations can take longer due to multiple metrics
        response = self.helper.evaluate_single(SAMPLE_PAYLOADS["rag_evaluation"], timeout=120)
        assert response.status_code == 200
        
        data = response.json()
        metrics = data["result"]["metrics"]
        
        # Should have faithfulness and contextual metrics
        assert "faithfulness" in metrics or "contextual_relevancy" in metrics
    
    def test_batch_evaluation(self):
        """Test batch evaluation"""
        response = self.helper.evaluate_batch(SAMPLE_PAYLOADS["batch_simple"])
        assert response.status_code == 200
        
        data = response.json()
        assert validate_response_schema(data, EXPECTED_BATCH_RESPONSE_KEYS)
        assert len(data["results"]) == 2
        assert data["total_cases"] == 2
        
        # Check each result
        for result in data["results"]:
            assert validate_response_schema(result, EXPECTED_RESULT_KEYS)
    
    def test_invalid_metric(self):
        """Test with invalid metric name"""
        payload = {
            "input": "Test",
            "actual_output": "Test",
            "metrics": ["invalid_metric"]
        }
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 400
    
    def test_invalid_provider(self):
        """Test with invalid model provider"""
        payload = {
            "input": "Test",
            "actual_output": "Test", 
            "model_configuration": {
                "provider": "invalid_provider",
                "model_name": "test"
            }
        }
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 422  # Validation error
    
    def test_missing_required_fields(self):
        """Test with missing required fields"""
        payload = {
            "input": "Test"
            # Missing actual_output
        }
        response = self.helper.evaluate_single(payload)
        assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    # Run tests when executed directly
    import subprocess
    import sys
    
    print("Running API endpoint tests...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", __file__, "-v"
    ], cwd="/Users/tle3/Workplace/codes/dtt/ai/deepeval-service")
    sys.exit(result.returncode)