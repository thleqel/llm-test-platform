from typing import List, Dict, Any, Optional
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
from deepeval.models import OllamaModel
try:
    from deepeval.models import OpenAIModel, AzureOpenAI
except ImportError:
    OpenAIModel = None
    AzureOpenAI = None
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    ContextualRelevancyMetric,
    ContextualPrecisionMetric,
    ContextualRecallMetric,
    HallucinationMetric,
    BiasMetric,
    ToxicityMetric,
    SummarizationMetric,
    GEval
)
from deepeval.test_case import LLMTestCaseParams
from deepeval.test_case import LLMTestCase

from src.config import settings
from src.models import ModelConfig

logger = logging.getLogger(__name__)


class DeepEvalService:
    def __init__(self):
        try:
            # Create the default DeepEval Ollama model
            self.default_model = OllamaModel(
                model=settings.ollama_model,
                base_url=settings.ollama_host,
                temperature=settings.ollama_temperature,
                timeout=settings.default_model_timeout
            )
            # Create thread pool for running sync deepeval operations
            self.executor = ThreadPoolExecutor(max_workers=1)  # Use single worker to avoid resource conflicts
            logger.info(f"Configured default DeepEval Ollama model: {settings.ollama_model} at {settings.ollama_host}")
            
            # Test the default model connection
            try:
                test_response = self.default_model.generate("Test connection")
                logger.info(f"Default model connection test successful: {test_response[:100]}...")
            except Exception as test_error:
                logger.warning(f"Default model connection test failed: {test_error}")
                
        except Exception as e:
            logger.error(f"Failed to initialize DeepEval service: {e}")
            raise
    
    def _create_model(self, model_config: Optional[ModelConfig] = None):
        """Create a model instance based on configuration"""
        if model_config is None:
            return self.default_model
        
        provider = model_config.provider.lower()
        
        try:
            if provider == "ollama":
                return OllamaModel(
                    model=model_config.model_name,
                    base_url=model_config.base_url or settings.ollama_host,
                    temperature=model_config.temperature,
                    timeout=model_config.timeout
                )
            elif provider == "openai":
                if OpenAIModel is None:
                    raise ValueError("OpenAI model support not available. Please install the required dependencies.")
                
                api_key = model_config.api_key or settings.openai_api_key
                if not api_key:
                    raise ValueError("OpenAI API key is required for OpenAI models")
                
                return OpenAIModel(
                    model=model_config.model_name,
                    api_key=api_key,
                    temperature=model_config.temperature
                )
            elif provider == "azure":
                if AzureOpenAI is None:
                    raise ValueError("Azure OpenAI model support not available. Please install the required dependencies.")
                
                api_key = model_config.api_key or settings.azure_openai_api_key
                endpoint = model_config.base_url or settings.azure_openai_endpoint
                
                if not api_key or not endpoint:
                    raise ValueError("Azure OpenAI API key and endpoint are required for Azure models")
                
                return AzureOpenAI(
                    model=model_config.model_name,
                    api_key=api_key,
                    azure_endpoint=endpoint,
                    api_version=settings.azure_openai_api_version,
                    temperature=model_config.temperature
                )
            else:
                raise ValueError(f"Unsupported model provider: {provider}. Supported providers: ollama, openai, azure")
        except Exception as e:
            logger.error(f"Failed to create model with provider '{provider}': {str(e)}")
            raise ValueError(f"Model initialization failed: {str(e)}")
        
    def _get_metric(self, metric_name: str, model, **kwargs) -> Any:
        """Get metric instance by name with specified model"""
        # Extract threshold from kwargs to avoid duplicate parameter error
        # Users can specify threshold in metric_kwargs and it will be applied to all metrics
        threshold = kwargs.pop('threshold', 0.5)  # Use user's threshold or default to 0.5
        
        # Log the threshold being used for transparency
        logger.debug(f"Creating {metric_name} metric with threshold={threshold}")
        
        # Use threshold and remaining kwargs for metric configuration
        metrics_map = {
            'answer_relevancy': lambda: AnswerRelevancyMetric(
                model=model, 
                threshold=threshold,
                include_reason=True, 
                **kwargs
            ),
            'faithfulness': lambda: FaithfulnessMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'contextual_relevancy': lambda: ContextualRelevancyMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'contextual_precision': lambda: ContextualPrecisionMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'contextual_recall': lambda: ContextualRecallMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'hallucination': lambda: HallucinationMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'bias': lambda: BiasMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'toxicity': lambda: ToxicityMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'summarization': lambda: SummarizationMetric(
                model=model, 
                threshold=threshold, 
                include_reason=True, 
                **kwargs
            ),
            'correctness' :lambda: GEval(
                name="Correctness",
                evaluation_steps=[
                    "Look at the input question and identify what factual information is being asked for",
                    "Extract the core factual answer from the 'expected output' (ignore formatting, focus on the key fact)",
                    "Check if the 'actual output' contains the same factual information as the expected output",
                    "The fact is important to determine the correctness of the answer, not exact wording or phrasing",
                    "Score 1.0 if the actual output is factually accurate comparing to the expected fact, 0.0 if factually incorrect or missing the key information"
                ],
                evaluation_params=[LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
                model=model
            )
        }
        
        if metric_name not in metrics_map:
            raise ValueError(f"Unsupported metric: {metric_name}")
            
        return metrics_map[metric_name]()
    
    def _measure_metric_sync(self, metric, test_case):
        """Measure metric synchronously in a separate thread"""
        try:
            metric.measure(test_case)
            return {
                "score": metric.score,
                "reason": getattr(metric, 'reason', 'No detailed reason provided'),
                "success": metric.success
            }
        except Exception as e:
            logger.error(f"Error measuring metric: {str(e)}")
            return {
                "score": 0.0,
                "reason": f"Error measuring metric: {str(e)}",
                "success": False
            }
    
    async def evaluate_single(
        self,
        input_text: str,
        actual_output: str,
        expected_output: Optional[str] = None,
        retrieval_context: Optional[List[str]] = None,
        metrics: List[str] = ["answer_relevancy"],
        model_config: Optional[ModelConfig] = None,
        **metric_kwargs
    ) -> Dict[str, Any]:
        """Evaluate a single test case using DeepEval with specified model"""
        try:
            # Create model instance based on configuration
            model = self._create_model(model_config)
            
            # Create test case
            test_case = LLMTestCase(
                input=input_text,
                actual_output=actual_output,
                expected_output=expected_output,
                retrieval_context=retrieval_context
            )
            
            # Initialize metrics
            metric_instances = []
            for metric_name in metrics:
                metric_instance = self._get_metric(metric_name, model, **metric_kwargs)
                metric_instances.append(metric_instance)
            
            # Evaluate each metric individually
            results = {
                "test_case": {
                    "input": input_text,
                    "actual_output": actual_output,
                    "expected_output": expected_output,
                    "retrieval_context": retrieval_context
                },
                "metrics": {},
                "model_used": {
                    "provider": model_config.provider if model_config else "ollama",
                    "model_name": model_config.model_name if model_config else settings.ollama_model
                }
            }
            
            for i, metric in enumerate(metric_instances):
                metric_name = metrics[i]
                try:
                    # Run metric measurement in thread pool to avoid event loop issues with timeout
                    result = await asyncio.wait_for(
                        asyncio.get_event_loop().run_in_executor(
                            self.executor, 
                            self._measure_metric_sync, 
                            metric, 
                            test_case
                        ),
                        timeout=120  # 2 minute timeout
                    )
                    results["metrics"][metric_name] = result
                    
                except asyncio.TimeoutError:
                    logger.error(f"Timeout evaluating metric {metric_name}")
                    results["metrics"][metric_name] = {
                        "score": 0.0,
                        "reason": f"Metric evaluation timed out after 2 minutes",
                        "success": False
                    }
                except Exception as metric_error:
                    error_msg = str(metric_error)
                    logger.error(f"Error evaluating metric {metric_name}: {error_msg}")
                    
                    # Provide more specific error messages based on the error type
                    if "status code: 500" in error_msg:
                        reason = "Ollama server error - the model may have crashed due to resource limitations"
                    elif "signal: killed" in error_msg:
                        reason = "Ollama process was killed - likely due to insufficient memory or CPU resources"
                    elif "EOF" in error_msg or "connection" in error_msg.lower():
                        reason = "Connection lost to Ollama server - the model runner may have stopped"
                    elif "timeout" in error_msg.lower():
                        reason = "Request timed out - the model may be overloaded or unresponsive"
                    else:
                        reason = f"DeepEval metric evaluation failed: {error_msg}"
                    
                    results["metrics"][metric_name] = {
                        "score": 0.0,
                        "reason": reason,
                        "success": False
                    }
            
            return results
            
        except Exception as e:
            logger.error(f"Error in single evaluation: {str(e)}")
            raise
    
    async def evaluate_batch(
        self,
        test_cases: List[Dict[str, Any]],
        metrics: List[str] = ["answer_relevancy"],
        model_config: Optional[ModelConfig] = None,
        **metric_kwargs
    ) -> List[Dict[str, Any]]:
        """Evaluate multiple test cases"""
        try:
            results = []
            for case in test_cases:
                result = await self.evaluate_single(
                    input_text=case.get("input"),
                    actual_output=case.get("actual_output"),
                    expected_output=case.get("expected_output"),
                    retrieval_context=case.get("retrieval_context"),
                    metrics=metrics,
                    model_config=model_config,
                    **metric_kwargs
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch evaluation: {str(e)}")
            raise
    
    def get_available_metrics(self) -> List[Dict[str, str]]:
        """Get list of available metrics with descriptions"""
        return [
            {
                "name": "answer_relevancy",
                "description": "Measures how relevant the answer is to the given input"
            },
            {
                "name": "faithfulness",
                "description": "Measures factual consistency of the answer against the given context"
            },
            {
                "name": "contextual_relevancy",
                "description": "Measures how relevant the retrieved context is to the input"
            },
            {
                "name": "contextual_precision",
                "description": "Measures how precise the retrieved context is"
            },
            {
                "name": "contextual_recall",
                "description": "Measures how much of the relevant context was retrieved"
            },
            {
                "name": "hallucination",
                "description": "Detects if the answer contains hallucinated information"
            },
            {
                "name": "bias",
                "description": "Detects bias in the generated answer"
            },
            {
                "name": "toxicity",
                "description": "Detects toxic content in the generated answer"
            },
            {
                "name": "summarization",
                "description": "Evaluates the quality of summarization"
            },
            {
                "name": "correctness",
                "description": "Evaluates factual accuracy against expected output using custom GEval"
            }
        ]
    
    def get_supported_providers(self) -> List[Dict[str, Any]]:
        """Get list of supported model providers"""
        providers = [
            {
                "name": "ollama",
                "description": "Local Ollama models",
                "available": True,
                "required_fields": ["model_name"],
                "optional_fields": ["base_url", "temperature", "timeout"]
            }
        ]
        
        if OpenAIModel is not None:
            providers.append({
                "name": "openai",
                "description": "OpenAI GPT models",
                "available": True,
                "required_fields": ["model_name", "api_key"],
                "optional_fields": ["temperature"]
            })
        
        if AzureOpenAI is not None:
            providers.append({
                "name": "azure",
                "description": "Azure OpenAI models",
                "available": True,
                "required_fields": ["model_name", "api_key", "base_url"],
                "optional_fields": ["temperature"]
            })
        
        return providers


# Global service instance
deepeval_service = DeepEvalService()