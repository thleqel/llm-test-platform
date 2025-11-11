"""
Test utilities and helpers for DeepEval Service tests
"""

import requests
import time
import json
from typing import Dict, Any, Optional


class ServiceTestHelper:
    """Helper class for testing the DeepEval Service"""
    
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        
    def is_service_healthy(self, timeout: int = 5) -> bool:
        """Check if the service is running and healthy"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=timeout)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def is_ollama_healthy(self, ollama_url: str = "http://localhost:11434", timeout: int = 5) -> bool:
        """Check if Ollama is running and healthy"""
        try:
            response = requests.get(f"{ollama_url}/api/version", timeout=timeout)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def wait_for_service(self, max_wait: int = 30, check_interval: int = 1) -> bool:
        """Wait for service to become healthy"""
        for _ in range(max_wait):
            if self.is_service_healthy():
                return True
            time.sleep(check_interval)
        return False
    
    def get_metrics(self) -> Optional[Dict[str, Any]]:
        """Get available metrics from the service"""
        try:
            response = requests.get(f"{self.api_base}/evaluation/metrics", timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except requests.exceptions.RequestException:
            return None
    
    def get_providers(self) -> Optional[Dict[str, Any]]:
        """Get available model providers from the service"""
        try:
            response = requests.get(f"{self.api_base}/evaluation/providers", timeout=10)
            if response.status_code == 200:
                return response.json()
            return None
        except requests.exceptions.RequestException:
            return None
    
    def evaluate_single(self, payload: Dict[str, Any], timeout: int = 60) -> requests.Response:
        """Send single evaluation request"""
        return requests.post(
            f"{self.api_base}/evaluation/single",
            json=payload,
            timeout=timeout
        )
    
    def evaluate_batch(self, payload: Dict[str, Any], timeout: int = 120) -> requests.Response:
        """Send batch evaluation request"""
        return requests.post(
            f"{self.api_base}/evaluation/batch", 
            json=payload,
            timeout=timeout
        )


# Test data fixtures
SAMPLE_PAYLOADS = {
    "minimal_single": {
        "input": "What is the capital of France?",
        "actual_output": "Paris"
    },
    
    "complete_single": {
        "input": "What is machine learning?",
        "actual_output": "Machine learning is a branch of AI that enables computers to learn from data.",
        "expected_output": "ML is AI that learns from data",
        "retrieval_context": [
            "Machine learning is a subset of artificial intelligence",
            "ML algorithms find patterns in data"
        ],
        "metrics": ["answer_relevancy", "correctness"],
        "model_configuration": {
            "provider": "ollama",
            "model_name": "llama3.1:8b",
            "temperature": 0.0
        }
    },
    
    "with_threshold": {
        "input": "What is 2+2?",
        "actual_output": "2+2 equals 4",
        "expected_output": "4",
        "metrics": ["answer_relevancy", "correctness"],
        "metric_kwargs": {"threshold": 0.8}
    },
    
    "rag_evaluation": {
        "input": "How does photosynthesis work?",
        "actual_output": "Plants convert sunlight into energy using chlorophyll.",
        "retrieval_context": [
            "Photosynthesis converts sunlight to energy",
            "Chlorophyll captures light in plant leaves"
        ],
        "metrics": ["answer_relevancy", "faithfulness", "contextual_relevancy"]
    },
    
    "batch_simple": {
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
        "metrics": ["answer_relevancy", "correctness"]
    }
}

# Expected response schemas
EXPECTED_SINGLE_RESPONSE_KEYS = {
    "result", "status"
}

EXPECTED_RESULT_KEYS = {
    "test_case", "metrics", "model_used"
}

EXPECTED_METRIC_KEYS = {
    "score", "reason", "success"
}

EXPECTED_BATCH_RESPONSE_KEYS = {
    "results", "total_cases", "status"
}


def print_test_result(test_name: str, success: bool, details: str = ""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"    {details}")


def validate_response_schema(response_data: Dict[str, Any], expected_keys: set) -> bool:
    """Validate that response has expected keys"""
    return set(response_data.keys()) >= expected_keys


def validate_metric_result(metric_result: Dict[str, Any]) -> bool:
    """Validate metric result structure"""
    if not validate_response_schema(metric_result, EXPECTED_METRIC_KEYS):
        return False
    
    # Validate data types
    if not isinstance(metric_result["score"], (int, float)):
        return False
    if not isinstance(metric_result["reason"], str):
        return False
    if not isinstance(metric_result["success"], bool):
        return False
    
    # Validate score range
    if not (0.0 <= metric_result["score"] <= 1.0):
        return False
    
    return True