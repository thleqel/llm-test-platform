"""Parallel test execution runner."""

import asyncio
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from uuid import uuid4

from ..models import TestCase, TestResult, TestRun
from ..client import DeepEvalClient
from .executor import TestExecutor


class ParallelTestRunner:
    """Run tests in parallel with concurrency control."""
    
    def __init__(
        self,
        deepeval_client: DeepEvalClient,
        max_concurrency: int = 10,
        default_adapter: Optional[Dict[str, Any]] = None,
        result_store=None
    ):
        self.deepeval_client = deepeval_client
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.default_adapter = default_adapter
        self.result_store = result_store
        self.executor = TestExecutor(
            deepeval_client=deepeval_client,
            default_adapter=default_adapter
        )
    
    async def run_tests(
        self,
        test_cases: List[TestCase],
        suite_name: str = "default",
        runtime_context: Optional[Dict[str, Any]] = None
    ) -> Tuple[TestRun, List[TestResult]]:
        """Run all test cases in parallel."""
        run_id = str(uuid4())
        start_time = datetime.now()
        
        # Create test run
        test_run = TestRun(
            id=run_id,
            suite_name=suite_name,
            start_time=start_time,
            total_tests=len(test_cases),
            metadata=runtime_context or {}
        )
        
        # Update executor context
        self.executor.runtime_context = runtime_context or {}
        
        # Execute tests in parallel
        tasks = [
            self._run_single_test_with_semaphore(tc, run_id)
            for tc in test_cases
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        test_results = []
        for result in results:
            if isinstance(result, Exception):
                # Handle exceptions
                continue
            
            test_results.append(result)
            
            # Update counters
            if result.status == "passed":
                test_run.passed += 1
            elif result.status == "failed":
                test_run.failed += 1
            elif result.status == "error":
                test_run.errors += 1
            elif result.status == "skipped":
                test_run.skipped += 1
        
        # Finalize run
        test_run.end_time = datetime.now()
        test_run.status = "completed"
        
        # Save results if store provided
        if self.result_store:
            self.result_store.save_run(test_run, test_results)
        
        return test_run, test_results
    
    async def _run_single_test_with_semaphore(
        self,
        test_case: TestCase,
        run_id: str
    ) -> TestResult:
        """Run a single test with semaphore for rate limiting."""
        async with self.semaphore:
            return await self.executor.execute_test_case(test_case, run_id)
