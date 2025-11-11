"""Test results router - query and export results."""

from fastapi import APIRouter, HTTPException, Response
from typing import Optional
from pathlib import Path
import os

from llm_test_framework import FileResultStore

router = APIRouter()

# Use absolute path for test results
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
TEST_RESULTS_DIR = Path(os.getenv("TEST_RESULTS_DIR", str(PROJECT_ROOT / "test_results")))
result_store = FileResultStore(results_dir=str(TEST_RESULTS_DIR))


@router.get("/runs")
async def list_runs(suite_name: Optional[str] = None, limit: int = 20):
    """List recent test runs."""
    try:
        runs = result_store.list_runs(suite_name=suite_name, limit=limit)
        
        return {
            "runs": runs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get test run details."""
    try:
        run_data = result_store.get_run(run_id)
        
        if not run_data:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        
        # Load results
        results = result_store.get_run_results(run_id)
        summary = result_store.get_summary(run_id)
        
        return {
            "run": run_data,
            "summary": summary,
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}/summary")
async def get_run_summary(run_id: str):
    """Get test run summary."""
    try:
        summary = result_store.get_summary(run_id)
        
        if not summary:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}/results")
async def get_run_results(run_id: str):
    """Get all test results for a run."""
    try:
        results = result_store.get_run_results(run_id)
        
        if not results:
            raise HTTPException(status_code=404, detail=f"No results found for run '{run_id}'")
        
        return {
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-cases/{test_case_id}/history")
async def get_test_case_history(test_case_id: str, limit: int = 10):
    """Get historical results for a test case."""
    try:
        history = result_store.get_test_case_history(test_case_id, limit=limit)
        
        return {
            "test_case_id": test_case_id,
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}/export/html")
async def export_html(run_id: str):
    """Export test results as HTML."""
    try:
        html_content = result_store.export_to_html(run_id)
        
        return Response(
            content=html_content,
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename=test_report_{run_id}.html"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}/export/json")
async def export_json(run_id: str):
    """Export test results as JSON."""
    try:
        run_data = result_store.get_run(run_id)
        results = result_store.get_run_results(run_id)
        summary = result_store.get_summary(run_id)
        
        if not run_data:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        
        export_data = {
            "run": run_data,
            "summary": summary,
            "results": results
        }
        
        return export_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview")
async def get_stats_overview():
    """Get overview statistics."""
    try:
        runs = result_store.list_runs(limit=100)
        
        total_runs = len(runs)
        total_tests = sum(run.get("total_tests", 0) for run in runs)
        total_passed = sum(run.get("passed", 0) for run in runs)
        total_failed = sum(run.get("failed", 0) for run in runs)
        
        pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        return {
            "total_runs": total_runs,
            "total_tests": total_tests,
            "total_passed": total_passed,
            "total_failed": total_failed,
            "pass_rate": round(pass_rate, 2),
            "recent_runs": runs[:10]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/by-suite")
async def get_stats_by_suite():
    """Get statistics grouped by test suite."""
    try:
        runs = result_store.list_runs(limit=100)
        
        suite_stats = {}
        for run in runs:
            suite_name = run.get("suite_name", "Unknown")
            if suite_name not in suite_stats:
                suite_stats[suite_name] = {
                    "runs": 0,
                    "tests": 0,
                    "passed": 0,
                    "failed": 0
                }
            
            suite_stats[suite_name]["runs"] += 1
            suite_stats[suite_name]["tests"] += run.get("total_tests", 0)
            suite_stats[suite_name]["passed"] += run.get("passed", 0)
            suite_stats[suite_name]["failed"] += run.get("failed", 0)
        
        # Calculate pass rates
        for suite_name, stats in suite_stats.items():
            total = stats["tests"]
            stats["pass_rate"] = round((stats["passed"] / total * 100) if total > 0 else 0, 2)
        
        return {"suites": suite_stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
