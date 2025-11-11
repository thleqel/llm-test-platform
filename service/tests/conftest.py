"""
Pytest configuration and fixtures
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

from src.services.deepeval_service import DeepEvalService


@pytest.fixture
def mock_deepeval():
    """Mock DeepEval service"""
    with patch('src.services.deepeval_service.AnswerRelevancyMetric') as mock_answer, \
         patch('src.services.deepeval_service.FaithfulnessMetric') as mock_faith, \
         patch('src.services.deepeval_service.CorrectnessMetric') as mock_correct, \
         patch('src.services.deepeval_service.ContextualPrecisionMetric') as mock_precision, \
         patch('src.services.deepeval_service.ContextualRecallMetric') as mock_recall, \
         patch('src.services.deepeval_service.ContextualRelevancyMetric') as mock_relevancy, \
         patch('src.services.deepeval_service.BiasMetric') as mock_bias, \
         patch('src.services.deepeval_service.ToxicityMetric') as mock_toxicity, \
         patch('src.services.deepeval_service.HallucinationMetric') as mock_hallucination:
        
        # Configure mock metrics to return realistic results
        def create_mock_metric(score=0.8, success=True, reason="Test passed"):
            mock_metric = Mock()
            mock_metric.score = score
            mock_metric.success = success
            mock_metric.reason = reason
            mock_metric.is_successful.return_value = success
            return mock_metric
        
        # Configure each metric mock
        mock_answer.return_value = create_mock_metric()
        mock_faith.return_value = create_mock_metric()
        mock_correct.return_value = create_mock_metric()
        mock_precision.return_value = create_mock_metric()
        mock_recall.return_value = create_mock_metric()
        mock_relevancy.return_value = create_mock_metric()
        mock_bias.return_value = create_mock_metric()
        mock_toxicity.return_value = create_mock_metric()
        mock_hallucination.return_value = create_mock_metric()
        
        yield {
            'answer_relevancy': mock_answer,
            'faithfulness': mock_faith,
            'correctness': mock_correct,
            'contextual_precision': mock_precision,
            'contextual_recall': mock_recall,
            'contextual_relevancy': mock_relevancy,
            'bias': mock_bias,
            'toxicity': mock_toxicity,
            'hallucination': mock_hallucination
        }


@pytest.fixture
def mock_models():
    """Mock model creation"""
    with patch('src.services.deepeval_service.ChatOllama') as mock_ollama, \
         patch('src.services.deepeval_service.ChatOpenAI') as mock_openai, \
         patch('src.services.deepeval_service.AzureChatOpenAI') as mock_azure:
        
        # Create mock model instances
        mock_ollama_instance = Mock()
        mock_openai_instance = Mock()
        mock_azure_instance = Mock()
        
        mock_ollama.return_value = mock_ollama_instance
        mock_openai.return_value = mock_openai_instance
        mock_azure.return_value = mock_azure_instance
        
        yield {
            'ollama': mock_ollama,
            'openai': mock_openai,
            'azure': mock_azure
        }


@pytest.fixture
def deepeval_service():
    """Create DeepEval service instance"""
    return DeepEvalService()


@pytest.fixture
def sample_test_case():
    """Sample test case data"""
    return {
        "input": "What is the capital of France?",
        "actual_output": "The capital of France is Paris.",
        "expected_output": "Paris",
        "retrieval_context": [
            "France is a country in Western Europe.",
            "Paris is the largest city in France.",
            "Paris has been the capital of France for centuries."
        ]
    }


@pytest.fixture
def sample_model_config():
    """Sample model configuration"""
    return {
        "provider": "ollama",
        "model_name": "llama3.1:8b",
        "temperature": 0.0,
        "timeout": 120
    }


@pytest.fixture
def sample_metrics():
    """Sample metrics list"""
    return ["answer_relevancy", "faithfulness", "correctness"]


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def service_url():
    """Service URL for integration tests"""
    return "http://localhost:8001"


@pytest.fixture(scope="session") 
def ollama_url():
    """Ollama URL for integration tests"""
    return "http://localhost:11434"


# Test configuration
pytest_plugins = []

def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Add unit marker to non-integration tests
        if "integration" not in [mark.name for mark in item.iter_markers()]:
            item.add_marker(pytest.mark.unit)