"""Test executor with trigger system integration."""

import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

from ..adapters import AdapterFactory
from ..client import DeepEvalClient
from ..models import TestCase, TestResult, TestStatus, MetricResult


class TestExecutor:
    """Executes individual test cases using trigger adapters."""
    
    def __init__(
        self,
        deepeval_client: DeepEvalClient,
        default_adapter: Optional[Dict[str, Any]] = None,
        runtime_context: Optional[Dict[str, Any]] = None
    ):
        self.deepeval_client = deepeval_client
        self.default_adapter = default_adapter
        self.runtime_context = runtime_context or {}
    
    async def execute_test_case(
        self,
        test_case: TestCase,
        run_id: str
    ) -> TestResult:
        """Execute a single test case."""
        start_time = datetime.now()
        
        try:
            # Skip if disabled
            if not test_case.enabled:
                return TestResult(
                    test_case_id=test_case.id,
                    run_id=run_id,
                    status=TestStatus.SKIPPED,
                    error=test_case.skip_reason or "Test disabled",
                    timestamp=start_time
                )
            
            # Get adapter
            adapter_config = test_case.adapter or self.default_adapter
            if not adapter_config:
                raise ValueError(f"No adapter configured for test {test_case.id}")
            
            adapter = AdapterFactory.create(adapter_config)
            
            # Setup adapter (e.g., launch browser)
            await adapter.setup()
            
            try:
                # Execute adapter to get actual_output
                adapter_result = await adapter.execute(
                    test_case=test_case.__dict__,
                    context=self.runtime_context
                )
                
                if not adapter_result.success:
                    return TestResult(
                        test_case_id=test_case.id,
                        run_id=run_id,
                        status=TestStatus.ERROR,
                        error=adapter_result.error,
                        metadata=adapter_result.metadata,
                        timestamp=start_time,
                        duration_ms=(datetime.now() - start_time).total_seconds() * 1000
                    )
                
                # Evaluate with DeepEval service
                # Pass threshold as metric_kwargs (single value for the first metric)
                # DeepEval expects threshold as a single number, not a dict
                metric_kwargs = None
                if test_case.thresholds and test_case.metrics:
                    # Get threshold for the first metric being evaluated
                    first_metric = test_case.metrics[0]
                    if first_metric in test_case.thresholds:
                        metric_kwargs = {"threshold": test_case.thresholds[first_metric]}
                
                print(f"\n🔍 DEBUG: Calling DeepEval with:")
                print(f"   input: {test_case.input}")
                print(f"   actual_output: {adapter_result.actual_output}")
                print(f"   expected_output: {test_case.expected_output}")
                print(f"   metrics: {test_case.metrics}")
                print(f"   metric_kwargs: {metric_kwargs}")
                
                evaluation_result = await self.deepeval_client.evaluate_single(
                    input=test_case.input,
                    actual_output=adapter_result.actual_output,
                    expected_output=test_case.expected_output,
                    retrieval_context=test_case.retrieval_context,
                    metrics=test_case.metrics,
                    metric_kwargs=metric_kwargs
                )
                
                print(f"\n📥 DEBUG: DeepEval response:")
                import json
                print(json.dumps(evaluation_result, indent=2))
                
                # Parse metrics
                metric_results = []
                all_passed = True
                
                # Metrics come back as a dict, not a list
                metrics_dict = evaluation_result.get("result", {}).get("metrics", {})
                for metric_name, metric_data in metrics_dict.items():
                    # Check if metric evaluation succeeded
                    # Use actual score if available, even if success=false
                    score = metric_data.get("score", 0.0)
                    threshold = test_case.thresholds.get(
                        metric_name,
                        metric_data.get("threshold", 0.5)
                    )
                    
                    if not metric_data.get("success", True):
                        # Include failed metric with actual score (if available) and error reason
                        metric_results.append(MetricResult(
                            name=metric_name,
                            score=score,
                            threshold=threshold,
                            passed=False,
                            reason=metric_data.get("reason", "Metric evaluation failed"),
                            metadata={"error": True, "success": False}
                        ))
                        all_passed = False
                        continue
                        
                    passed = score >= threshold
                    all_passed = all_passed and passed
                    
                    metric_results.append(MetricResult(
                        name=metric_name,
                        score=score,
                        threshold=threshold,
                        passed=passed,
                        reason=metric_data.get("reason"),
                        metadata=metric_data.get("metadata", {})
                    ))
                
                return TestResult(
                    test_case_id=test_case.id,
                    run_id=run_id,
                    status=TestStatus.PASSED if all_passed else TestStatus.FAILED,
                    actual_output=adapter_result.actual_output,
                    expected_output=test_case.expected_output,
                    metrics=metric_results,
                    passed=all_passed,
                    metadata={
                        **adapter_result.metadata,
                        "evaluation": evaluation_result
                    },
                    timestamp=start_time,
                    duration_ms=(datetime.now() - start_time).total_seconds() * 1000
                )
            
            finally:
                # Cleanup adapter (e.g., close browser)
                await adapter.teardown()
        
        except Exception as e:
            return TestResult(
                test_case_id=test_case.id,
                run_id=run_id,
                status=TestStatus.ERROR,
                error=str(e),
                timestamp=start_time,
                duration_ms=(datetime.now() - start_time).total_seconds() * 1000
            )
