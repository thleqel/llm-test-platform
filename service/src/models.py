from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Literal


class InputTestCase(BaseModel):
    """Input data for a test case evaluation."""
    
    input: str = Field(..., description="The input/question for evaluation")
    actual_output: str = Field(..., description="The actual output/answer to evaluate")
    expected_output: Optional[str] = Field(None, description="The expected output/answer (optional)")
    retrieval_context: Optional[List[str]] = Field(None, description="Context used for retrieval (optional)")


class ModelConfig(BaseModel):
    """Configuration for model providers."""
    
    provider: Literal["ollama", "openai", "azure"] = Field("ollama", description="Model provider")
    model_name: str = Field("llama3.1:8b", description="Name of the model to use")
    base_url: Optional[str] = Field(None, description="Base URL for the model API (optional)")
    api_key: Optional[str] = Field(None, description="API key for the model (optional)")
    temperature: float = Field(0.0, description="Temperature for model generation")
    timeout: int = Field(180, description="Timeout in seconds for model requests")
    
    @field_validator('temperature')
    @classmethod
    def validate_temperature(cls, v):
        if not 0.0 <= v <= 2.0:
            raise ValueError('Temperature must be between 0.0 and 2.0')
        return v


class SingleEvaluationRequest(BaseModel):
    input: str = Field(..., description="The input/question for evaluation")
    actual_output: str = Field(..., description="The actual output/answer to evaluate")
    expected_output: Optional[str] = Field(None, description="The expected output/answer (optional)")
    retrieval_context: Optional[List[str]] = Field(None, description="Context used for retrieval (optional)")
    metrics: List[str] = Field(["answer_relevancy"], description="List of metrics to evaluate")
    metric_kwargs: Optional[Dict[str, Any]] = Field({}, description="Additional parameters for metrics")
    model_configuration: Optional[ModelConfig] = Field(None, description="Model configuration (uses default if not provided)")


class BatchEvaluationRequest(BaseModel):
    test_cases: List[InputTestCase] = Field(..., description="List of test cases to evaluate")
    metrics: List[str] = Field(["answer_relevancy"], description="List of metrics to evaluate")
    metric_kwargs: Optional[Dict[str, Any]] = Field({}, description="Additional parameters for metrics")
    model_configuration: Optional[ModelConfig] = Field(None, description="Model configuration (uses default if not provided)")


class MetricResult(BaseModel):
    score: float = Field(..., description="The metric score")
    reason: str = Field(..., description="Explanation for the score")
    success: bool = Field(..., description="Whether the metric passed")


class EvaluationResult(BaseModel):
    test_case: InputTestCase = Field(..., description="The test case that was evaluated")
    metrics: Dict[str, MetricResult] = Field(..., description="Results for each metric")
    model_used: Dict[str, str] = Field(..., description="Information about the model used for evaluation")


class SingleEvaluationResponse(BaseModel):
    result: EvaluationResult = Field(..., description="Evaluation result")
    status: str = Field(..., description="Status of the evaluation")


class BatchEvaluationResponse(BaseModel):
    results: List[EvaluationResult] = Field(..., description="List of evaluation results")
    total_cases: int = Field(..., description="Total number of test cases evaluated")
    status: str = Field(..., description="Status of the evaluation")


class MetricInfo(BaseModel):
    name: str = Field(..., description="Name of the metric")
    description: str = Field(..., description="Description of what the metric measures")


class MetricsListResponse(BaseModel):
    metrics: List[MetricInfo] = Field(..., description="List of available metrics")
    total_metrics: int = Field(..., description="Total number of available metrics")


class ModelProviderInfo(BaseModel):
    name: str = Field(..., description="Name of the model provider")
    description: str = Field(..., description="Description of the provider")
    available: bool = Field(..., description="Whether the provider is available")
    required_fields: List[str] = Field(..., description="Required configuration fields")
    optional_fields: List[str] = Field(..., description="Optional configuration fields")


class ModelProvidersResponse(BaseModel):
    providers: List[ModelProviderInfo] = Field(..., description="List of available model providers")
    total_providers: int = Field(..., description="Total number of available providers")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    status: str = Field("error", description="Status of the request")