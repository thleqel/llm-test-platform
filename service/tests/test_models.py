"""
Model validation tests for DeepEval Service
"""

import pytest
import sys
from pathlib import Path
from pydantic import ValidationError

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.models import (
    ModelConfig,
    InputTestCase,
    SingleEvaluationRequest,
    BatchEvaluationRequest,
    MetricResult,
    EvaluationResult
)


class TestModelValidation:
    """Test Pydantic model validation"""
    
    def test_model_config_creation(self):
        """Test ModelConfig creation with valid data"""
        config = ModelConfig(
            provider="ollama",
            model_name="llama3.1:8b",
            temperature=0.5
        )
        assert config.provider == "ollama"
        assert config.model_name == "llama3.1:8b"
        assert config.temperature == 0.5
        assert config.timeout == 180  # default
    
    def test_model_config_defaults(self):
        """Test ModelConfig default values"""
        config = ModelConfig()
        assert config.provider == "ollama"
        assert config.model_name == "llama3.1:8b"
        assert config.temperature == 0.0
        assert config.timeout == 180
    
    def test_model_config_openai(self):
        """Test ModelConfig for OpenAI provider"""
        config = ModelConfig(
            provider="openai",
            model_name="gpt-4",
            api_key="test-key",
            temperature=0.2
        )
        assert config.provider == "openai"
        assert config.api_key == "test-key"
    
    def test_test_case_input_minimal(self):
        """Test InputTestCase with minimal data"""
        case = InputTestCase(
            input="What is AI?",
            actual_output="AI is artificial intelligence"
        )
        assert case.input == "What is AI?"
        assert case.actual_output == "AI is artificial intelligence"
        assert case.expected_output is None
        assert case.retrieval_context is None
    
    def test_test_case_input_complete(self):
        """Test InputTestCase with all fields"""
        case = InputTestCase(
            input="What is AI?",
            actual_output="AI is artificial intelligence",
            expected_output="Artificial intelligence",
            retrieval_context=["AI context 1", "AI context 2"]
        )
        assert len(case.retrieval_context) == 2
    
    def test_single_evaluation_request_minimal(self):
        """Test SingleEvaluationRequest with minimal data"""
        request = SingleEvaluationRequest(
            input="Test input",
            actual_output="Test output"
        )
        assert request.metrics == ["answer_relevancy"]  # default
        assert request.metric_kwargs == {}  # default
        assert request.model_configuration is None  # default
    
    def test_single_evaluation_request_complete(self):
        """Test SingleEvaluationRequest with all fields"""
        config = ModelConfig(provider="ollama", model_name="test")
        request = SingleEvaluationRequest(
            input="Test input",
            actual_output="Test output", 
            expected_output="Expected",
            retrieval_context=["context"],
            metrics=["answer_relevancy", "correctness"],
            metric_kwargs={"threshold": 0.8},
            model_configuration=config
        )
        assert len(request.metrics) == 2
        assert request.metric_kwargs["threshold"] == 0.8
        assert request.model_configuration.provider == "ollama"
    
    def test_batch_evaluation_request(self):
        """Test BatchEvaluationRequest"""
        test_cases = [
            InputTestCase(input="Q1", actual_output="A1"),
            InputTestCase(input="Q2", actual_output="A2")
        ]
        request = BatchEvaluationRequest(test_cases=test_cases)
        assert len(request.test_cases) == 2
        assert request.metrics == ["answer_relevancy"]  # default
    
    def test_metric_result_creation(self):
        """Test MetricResult creation"""
        result = MetricResult(
            score=0.85,
            reason="Good answer",
            success=True
        )
        assert result.score == 0.85
        assert result.reason == "Good answer"
        assert result.success is True
    
    def test_evaluation_result_creation(self):
        """Test EvaluationResult creation"""
        test_case = InputTestCase(input="Q", actual_output="A")
        metric_result = MetricResult(score=0.8, reason="Good", success=True)
        
        result = EvaluationResult(
            test_case=test_case,
            metrics={"answer_relevancy": metric_result},
            model_used={"provider": "ollama", "model_name": "llama3.1:8b"}
        )
        assert result.test_case.input == "Q"
        assert "answer_relevancy" in result.metrics
        assert result.metrics["answer_relevancy"].score == 0.8
        assert result.model_used["provider"] == "ollama"
    
    def test_validation_errors(self):
        """Test validation errors for invalid data"""
        
        # Missing required field
        with pytest.raises(ValidationError):
            SingleEvaluationRequest(input="test")  # missing actual_output
        
        # Invalid provider
        with pytest.raises(ValidationError):
            ModelConfig(provider="invalid_provider")
        
        # Invalid temperature
        with pytest.raises(ValidationError):
            ModelConfig(temperature=3.0)  # too high
            
        with pytest.raises(ValidationError):
            ModelConfig(temperature=-1.0)  # too low
        
        # Missing required fields for BatchEvaluationRequest
        with pytest.raises(ValidationError):
            BatchEvaluationRequest()  # missing test_cases
    
    def test_temperature_validation(self):
        """Test temperature validation in ModelConfig"""
        # Valid temperatures
        ModelConfig(temperature=0.0)
        ModelConfig(temperature=1.0)
        ModelConfig(temperature=0.5)
        
        # Invalid temperatures should raise ValidationError
        with pytest.raises(ValidationError):
            ModelConfig(temperature=-0.1)  # too low
        
        with pytest.raises(ValidationError):
            ModelConfig(temperature=2.5)  # too high
    
    def test_field_descriptions(self):
        """Test that fields have proper descriptions"""
        # Check that Field descriptions are accessible
        request = SingleEvaluationRequest(
            input="test",
            actual_output="test"
        )
        
        # Field info should be available via model schema
        schema = SingleEvaluationRequest.model_json_schema()
        properties = schema["properties"]
        
        assert "input" in properties
        assert "description" in properties["input"]
        assert "actual_output" in properties
        assert "description" in properties["actual_output"]


if __name__ == "__main__":
    # Run tests when executed directly
    import subprocess
    import sys
    
    print("Running model validation tests...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", __file__, "-v"
    ], cwd="/Users/tle3/Workplace/codes/dtt/ai/deepeval-service")
    sys.exit(result.returncode)