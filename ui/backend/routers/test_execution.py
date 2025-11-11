"""Test execution router - run tests and manage execution."""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from pathlib import Path

from llm_test_framework import (
    YAMLLoader,
    ParallelTestRunner,
    DeepEvalClient,
    FileResultStore
)
import os

router = APIRouter()

# Configuration - use same path resolution as test_artifacts
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ARTIFACTS_DIR = Path(os.getenv("TEST_ARTIFACTS_DIR", str(PROJECT_ROOT / "test_artifacts")))
TEST_SUITES_DIR = ARTIFACTS_DIR / "test_suites"
TEST_RESULTS_DIR = Path(os.getenv("TEST_RESULTS_DIR", str(PROJECT_ROOT / "test_results")))
DEEPEVAL_URL = "http://localhost:8001"

print(f"🎯 Test execution - suites directory: {TEST_SUITES_DIR}")
print(f"💾 Test execution - results directory: {TEST_RESULTS_DIR}")

# Store for background tasks
active_runs = {}


class RunRequest(BaseModel):
    """Request to run tests."""
    suite_name: str
    test_ids: Optional[List[str]] = None
    max_concurrency: int = 10


class RunResponse(BaseModel):
    """Response from starting a test run."""
    run_id: str
    status: str
    message: str


@router.post("/run", response_model=RunResponse)
async def run_tests(request: RunRequest, background_tasks: BackgroundTasks):
    """Start test execution in background."""
    try:
        # Find suite
        suite_files = list(TEST_SUITES_DIR.glob("*.yml")) + list(TEST_SUITES_DIR.glob("*.yaml"))
        suite = None
        
        for suite_file in suite_files:
            loaded_suite = YAMLLoader.load_suite(str(suite_file))
            if loaded_suite.name == request.suite_name:
                suite = loaded_suite
                break
        
        if not suite:
            raise HTTPException(status_code=404, detail=f"Suite '{request.suite_name}' not found")
        
        # Filter test cases if specified
        if request.test_ids:
            suite.test_cases = [tc for tc in suite.test_cases if tc.id in request.test_ids]
        
        if not suite.test_cases:
            raise HTTPException(status_code=400, detail="No test cases to run")
        
        # Create result store
        result_store = FileResultStore()
        
        # Generate run ID (will be created by runner)
        from uuid import uuid4
        run_id = str(uuid4())
        
        # Start execution in background
        background_tasks.add_task(
            _execute_tests,
            suite,
            request.max_concurrency,
            run_id
        )
        
        active_runs[run_id] = {
            "status": "running",
            "suite": suite.name,
            "total_tests": len(suite.test_cases)
        }
        
        return RunResponse(
            run_id=run_id,
            status="started",
            message=f"Started execution of {len(suite.test_cases)} tests"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _execute_tests(suite, max_concurrency: int, temp_run_id: str):
    """Execute tests in background."""
    try:
        print(f"🔄 Starting test execution for temp_id: {temp_run_id}")
        print(f"   Suite: {suite.name}, Tests: {len(suite.test_cases)}")
        
        async with DeepEvalClient(base_url=DEEPEVAL_URL) as client:
            print(f"✓ Connected to DeepEval at {DEEPEVAL_URL}")
            result_store = FileResultStore(results_dir=str(TEST_RESULTS_DIR))
            
            runner = ParallelTestRunner(
                deepeval_client=client,
                max_concurrency=max_concurrency,
                default_adapter=suite.default_adapter,
                result_store=result_store
            )
            
            print(f"🏃 Running tests...")
            # Run tests - this will generate its own run_id
            test_run, results = await runner.run_tests(
                test_cases=suite.test_cases,
                suite_name=suite.name
            )
            
            actual_run_id = test_run.id
            print(f"✅ Test execution completed!")
            print(f"   Actual Run ID: {actual_run_id}")
            print(f"   Passed: {test_run.passed}, Failed: {test_run.failed}, Errors: {test_run.errors}")
            
            # Keep temp entry but update with actual run_id for redirect
            active_runs[temp_run_id] = {
                "status": "completed",
                "suite": suite.name,
                "total_tests": test_run.total_tests,
                "passed": test_run.passed,
                "failed": test_run.failed,
                "errors": test_run.errors,
                "actual_run_id": actual_run_id  # Provide actual run_id for frontend redirect
            }
            
            # Also add entry for actual run_id
            active_runs[actual_run_id] = active_runs[temp_run_id].copy()
            
            print(f"💾 Results saved with run_id: {actual_run_id}")
    
    except Exception as e:
        print(f"❌ Error executing tests for temp_id {temp_run_id}:")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        active_runs[temp_run_id] = {
            "status": "error",
            "error": str(e)
        }


@router.get("/runs/{run_id}/status")
async def get_run_status(run_id: str):
    """Get status of a test run."""
    if run_id in active_runs:
        return active_runs[run_id]
    
    # Check if run exists in storage
    result_store = FileResultStore()
    run_data = result_store.get_run(run_id)
    
    if run_data:
        return {
            "status": run_data.get("status", "completed"),
            "suite": run_data.get("suite_name"),
            "total_tests": run_data.get("total_tests"),
            "passed": run_data.get("passed"),
            "failed": run_data.get("failed"),
            "errors": run_data.get("errors")
        }
    
    raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")


@router.get("/runs/active")
async def list_active_runs():
    """List currently active test runs."""
    return {
        "runs": [
            {
                "run_id": run_id,
                **info
            }
            for run_id, info in active_runs.items()
            if info.get("status") == "running"
        ]
    }


@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str):
    """Cancel a running test."""
    if run_id not in active_runs:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    
    if active_runs[run_id]["status"] != "running":
        raise HTTPException(status_code=400, detail="Run is not active")
    
    # TODO: Implement cancellation logic
    active_runs[run_id]["status"] = "cancelled"
    
    return {"message": "Run cancelled", "run_id": run_id}


@router.get("/health/deepeval")
async def check_deepeval_health():
    """Check if DeepEval service is healthy."""
    try:
        async with DeepEvalClient(base_url=DEEPEVAL_URL) as client:
            is_healthy = await client.health_check()
            
            return {
                "healthy": is_healthy,
                "url": DEEPEVAL_URL
            }
    except Exception as e:
        return {
            "healthy": False,
            "url": DEEPEVAL_URL,
            "error": str(e)
        }
