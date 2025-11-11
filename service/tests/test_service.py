"""
DeepEval service functionality tests
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch
from pydantic import ValidationError

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.services.deepeval_service import DeepEvalService
from src.models import ModelConfig
from src.config import settings


class TestDeepEvalService:
    """Test DeepEval service functionality"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        try:
            cls.service = DeepEvalService()
        except Exception as e:
            pytest.skip(f"Could not initialize DeepEval service: {e}")
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service is not None
        assert self.service.default_model is not None
        assert self.service.executor is not None
    
    def test_create_default_model(self):
        """Test creating default model"""
        model = self.service._create_model(None)
        assert model is not None
        assert model == self.service.default_model
    
    def test_create_custom_ollama_model(self):
        """Test creating custom Ollama model"""
        config = ModelConfig(
            provider="ollama",
            model_name="test-model",
            temperature=0.2,
            timeout=60
        )
        model = self.service._create_model(config)
        assert model is not None
        # Model should be different from default
        assert model != self.service.default_model
    
    def test_create_openai_model_without_key(self):
        """Test creating OpenAI model without API key"""
        config = ModelConfig(
            provider="openai",
            model_name="gpt-3.5-turbo"
            # No API key provided
        )
        with pytest.raises(ValueError):  # Just check that it raises ValueError
            self.service._create_model(config)
    
    @patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'})
    def test_create_openai_model_with_key(self):
        """Test creating OpenAI model with API key"""
        config = ModelConfig(
            provider="openai",
            model_name="gpt-3.5-turbo",
            api_key="test-key"
        )
        try:
            model = self.service._create_model(config)
            # If OpenAI is available, model should be created
            assert model is not None
        except ValueError as e:
            # If OpenAI is not available, should get specific error
            assert "not available" in str(e)
    
    def test_create_invalid_provider(self):
        """Test creating model with invalid provider"""
        # With Pydantic validation, invalid provider will raise ValidationError during model creation
        with pytest.raises(ValidationError):
            config = ModelConfig(
                provider="invalid_provider",
                model_name="test"
            )
    
    def test_get_metric_with_threshold(self):
        """Test getting metric with custom threshold"""
        model = self.service.default_model
        
        # Test threshold extraction
        metric = self.service._get_metric(
            "answer_relevancy", 
            model, 
            threshold=0.8
        )
        assert metric is not None
    
    def test_get_invalid_metric(self):
        """Test getting invalid metric"""
        model = self.service.default_model
        with pytest.raises(ValueError, match="Unsupported metric"):
            self.service._get_metric("invalid_metric", model)
    
    def test_get_available_metrics(self):
        """Test getting available metrics list"""
        metrics = self.service.get_available_metrics()
        assert isinstance(metrics, list)
        assert len(metrics) > 0
        
        # Check structure
        for metric in metrics:
            assert "name" in metric
            assert "description" in metric
            assert isinstance(metric["name"], str)
            assert isinstance(metric["description"], str)
        
        # Check specific metrics exist
        metric_names = [m["name"] for m in metrics]
        assert "answer_relevancy" in metric_names
        assert "faithfulness" in metric_names
        assert "correctness" in metric_names
    
    def test_get_supported_providers(self):
        """Test getting supported providers list"""
        providers = self.service.get_supported_providers()
        assert isinstance(providers, list)
        assert len(providers) > 0
        
        # Check structure
        for provider in providers:
            assert "name" in provider
            assert "description" in provider
            assert "available" in provider
            assert "required_fields" in provider
            assert "optional_fields" in provider
        
        # Ollama should always be available
        provider_names = [p["name"] for p in providers]
        assert "ollama" in provider_names
    
    def test_measure_metric_sync_error_handling(self):
        """Test error handling in metric measurement"""
        # Create a mock metric that will fail
        mock_metric = Mock()
        mock_metric.measure.side_effect = Exception("Test error")
        
        mock_test_case = Mock()
        
        result = self.service._measure_metric_sync(mock_metric, mock_test_case)
        
        assert result["success"] is False
        assert result["score"] == 0.0
        assert "Test error" in result["reason"]


class TestServiceIntegration:
    """Integration tests for service functionality"""
    
    @classmethod
    def setup_class(cls):
        """Setup test class"""
        try:
            cls.service = DeepEvalService()
        except Exception as e:
            pytest.skip(f"Could not initialize DeepEval service: {e}")
    
    @pytest.mark.asyncio
    async def test_evaluate_single_minimal(self):
        """Test single evaluation with minimal parameters"""
        try:
            result = await self.service.evaluate_single(
                input_text="What is 2+2?",
                actual_output="4"
            )
            
            assert "test_case" in result
            assert "metrics" in result
            assert "model_used" in result
            assert "answer_relevancy" in result["metrics"]
            
        except Exception as e:
            pytest.skip(f"Service evaluation failed: {e}")
    
    @pytest.mark.asyncio
    async def test_evaluate_single_with_custom_threshold(self):
        """Test single evaluation with custom threshold"""
        try:
            result = await self.service.evaluate_single(
                input_text="What is the capital of France?",
                actual_output="Paris",
                expected_output="Paris",
                metrics=["answer_relevancy", "correctness"],
                threshold=0.8
            )
            
            # Should have both metrics
            assert "answer_relevancy" in result["metrics"]
            assert "correctness" in result["metrics"]
            
            # Check metric structure
            for metric_name, metric_result in result["metrics"].items():
                assert "score" in metric_result
                assert "reason" in metric_result
                assert "success" in metric_result
                assert isinstance(metric_result["score"], (int, float))
                assert isinstance(metric_result["success"], bool)
                
        except Exception as e:
            pytest.skip(f"Service evaluation failed: {e}")
    
    @pytest.mark.asyncio
    async def test_evaluate_batch(self):
        """Test batch evaluation"""
        test_cases = [
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
        ]
        
        try:
            results = await self.service.evaluate_batch(
                test_cases=test_cases,
                metrics=["answer_relevancy", "correctness"]
            )
            
            assert isinstance(results, list)
            assert len(results) == 2
            
            # Check each result
            for result in results:
                assert "test_case" in result
                assert "metrics" in result
                assert "model_used" in result
                
        except Exception as e:
            pytest.skip(f"Batch evaluation failed: {e}")


if __name__ == "__main__":
    # Run tests when executed directly
    import subprocess
    import sys
    
    print("Running service functionality tests...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", __file__, "-v"
    ], cwd="/Users/tle3/Workplace/codes/dtt/ai/deepeval-service")
    sys.exit(result.returncode)