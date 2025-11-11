from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
import logging

from src.models import (
    SingleEvaluationRequest,
    BatchEvaluationRequest,
    SingleEvaluationResponse,
    BatchEvaluationResponse,
    MetricsListResponse,
    ModelProvidersResponse,
    ErrorResponse,
    EvaluationResult,
    MetricResult,
    InputTestCase,
    MetricInfo,
    ModelProviderInfo
)
from src.services.deepeval_service import deepeval_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.post(
    "/single",
    response_model=SingleEvaluationResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    summary="Evaluate a single test case",
    description="Evaluate a single input-output pair using specified metrics"
)
async def evaluate_single(request: SingleEvaluationRequest):
    """
    Evaluate a single test case with deepeval metrics.
    
    - **input**: The input/question for evaluation
    - **actual_output**: The actual output/answer to evaluate
    - **expected_output**: The expected output/answer (optional)
    - **retrieval_context**: Context used for retrieval (optional, required for some metrics)
    - **metrics**: List of metrics to evaluate (default: ["answer_relevancy"])
    - **metric_kwargs**: Additional parameters for metrics
    - **model_configuration**: Model configuration (provider, model_name, etc.) - uses default Ollama if not provided
    """
    try:
        result = await deepeval_service.evaluate_single(
            input_text=request.input,
            actual_output=request.actual_output,
            expected_output=request.expected_output,
            retrieval_context=request.retrieval_context,
            metrics=request.metrics,
            model_config=request.model_configuration,
            **request.metric_kwargs
        )
        
        # Convert to response model
        test_case = InputTestCase(
            input=result["test_case"]["input"],
            actual_output=result["test_case"]["actual_output"],
            expected_output=result["test_case"]["expected_output"],
            retrieval_context=result["test_case"]["retrieval_context"]
        )
        
        metrics = {}
        all_metrics_successful = True
        for metric_name, metric_data in result["metrics"].items():
            metrics[metric_name] = MetricResult(
                score=metric_data["score"],
                reason=metric_data["reason"],
                success=metric_data["success"]
            )
            if not metric_data["success"]:
                all_metrics_successful = False
        
        evaluation_result = EvaluationResult(
            test_case=test_case,
            metrics=metrics,
            model_used=result["model_used"]
        )
        
        # Determine overall status
        evaluation_status = "success" if all_metrics_successful else "partial_failure"
        
        return SingleEvaluationResponse(result=evaluation_result, status=evaluation_status)
        
    except ValueError as e:
        logger.error(f"Validation error in single evaluation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in single evaluation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during evaluation"
        )


@router.post(
    "/batch",
    response_model=BatchEvaluationResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    summary="Evaluate multiple test cases",
    description="Evaluate multiple input-output pairs using specified metrics"
)
async def evaluate_batch(request: BatchEvaluationRequest):
    """
    Evaluate multiple test cases with deepeval metrics.
    
    - **test_cases**: List of test cases to evaluate
    - **metrics**: List of metrics to evaluate (default: ["answer_relevancy"])
    - **metric_kwargs**: Additional parameters for metrics
    - **model_configuration**: Model configuration (provider, model_name, etc.) - uses default Ollama if not provided
    """
    try:
        # Convert test cases to dict format
        test_cases_dict = []
        for case in request.test_cases:
            test_cases_dict.append({
                "input": case.input,
                "actual_output": case.actual_output,
                "expected_output": case.expected_output,
                "retrieval_context": case.retrieval_context
            })
        
        results = await deepeval_service.evaluate_batch(
            test_cases=test_cases_dict,
            metrics=request.metrics,
            model_config=request.model_configuration,
            **request.metric_kwargs
        )
        
        # Convert to response model
        evaluation_results = []
        overall_success = True
        
        for result in results:
            test_case = InputTestCase(
                input=result["test_case"]["input"],
                actual_output=result["test_case"]["actual_output"],
                expected_output=result["test_case"]["expected_output"],
                retrieval_context=result["test_case"]["retrieval_context"]
            )
            
            metrics = {}
            for metric_name, metric_data in result["metrics"].items():
                metrics[metric_name] = MetricResult(
                    score=metric_data["score"],
                    reason=metric_data["reason"],
                    success=metric_data["success"]
                )
                if not metric_data["success"]:
                    overall_success = False
            
            evaluation_results.append(EvaluationResult(
                test_case=test_case,
                metrics=metrics,
                model_used=result["model_used"]
            ))
        
        # Determine overall status
        evaluation_status = "success" if overall_success else "partial_failure"
        
        return BatchEvaluationResponse(
            results=evaluation_results,
            total_cases=len(evaluation_results),
            status=evaluation_status
        )
        
    except ValueError as e:
        logger.error(f"Validation error in batch evaluation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in batch evaluation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during evaluation"
        )


@router.get(
    "/metrics",
    response_model=MetricsListResponse,
    summary="Get available metrics",
    description="Get a list of all available evaluation metrics"
)
async def get_available_metrics():
    """
    Get a list of all available evaluation metrics with descriptions.
    """
    try:
        metrics_data = deepeval_service.get_available_metrics()
        metrics = [MetricInfo(name=m["name"], description=m["description"]) for m in metrics_data]
        return MetricsListResponse(
            metrics=metrics,
            total_metrics=len(metrics)
        )
    except Exception as e:
        logger.error(f"Error getting available metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error getting metrics"
        )


@router.get(
    "/providers",
    response_model=ModelProvidersResponse,
    summary="Get available model providers",
    description="Get a list of all available model providers and their configuration requirements"
)
async def get_available_providers():
    """
    Get a list of all available model providers with their configuration requirements.
    """
    try:
        providers_data = deepeval_service.get_supported_providers()
        providers = [
            ModelProviderInfo(
                name=p["name"],
                description=p["description"],
                available=p["available"],
                required_fields=p["required_fields"],
                optional_fields=p["optional_fields"]
            ) for p in providers_data
        ]
        return ModelProvidersResponse(
            providers=providers,
            total_providers=len(providers)
        )
    except Exception as e:
        logger.error(f"Error getting available providers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error getting providers"
        )