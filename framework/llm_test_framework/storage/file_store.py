"""File-based result storage for local testing."""

import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from dataclasses import asdict

from ..models import TestResult, TestRun


class FileResultStore:
    """Store test results as JSON files (git-ignored)."""
    
    def __init__(self, results_dir: str = "test_results"):
        self.results_dir = Path(results_dir)
        self.runs_dir = self.results_dir / "runs"
        self.runs_dir.mkdir(parents=True, exist_ok=True)
    
    def save_run(self, test_run: TestRun, results: List[TestResult]) -> None:
        """Save test run and all results to files."""
        # Create run directory
        run_dir = self.runs_dir / test_run.id
        run_dir.mkdir(parents=True, exist_ok=True)
        
        # Save run metadata
        run_metadata = {
            "id": test_run.id,
            "suite_name": test_run.suite_name,
            "start_time": test_run.start_time.isoformat(),
            "end_time": test_run.end_time.isoformat() if test_run.end_time else None,
            "total_tests": test_run.total_tests,
            "passed": test_run.passed,
            "failed": test_run.failed,
            "errors": test_run.errors,
            "skipped": test_run.skipped,
            "status": test_run.status,
            "metadata": test_run.metadata
        }
        
        with open(run_dir / "metadata.json", "w") as f:
            json.dump(run_metadata, f, indent=2)
        
        # Save individual test results
        for result in results:
            result_data = {
                "test_case_id": result.test_case_id,
                "run_id": result.run_id,
                "status": result.status,
                "actual_output": result.actual_output,
                "expected_output": result.expected_output,
                "metrics": [
                    {
                        "name": m.name,
                        "score": m.score,
                        "threshold": m.threshold,
                        "passed": m.passed,
                        "reason": m.reason,
                        "metadata": m.metadata
                    }
                    for m in result.metrics
                ],
                "passed": result.passed,
                "error": result.error,
                "metadata": result.metadata,
                "timestamp": result.timestamp.isoformat(),
                "duration_ms": result.duration_ms
            }
            
            with open(run_dir / f"{result.test_case_id}.json", "w") as f:
                json.dump(result_data, f, indent=2)
        
        # Save summary
        summary = {
            "run_id": test_run.id,
            "suite_name": test_run.suite_name,
            "timestamp": test_run.start_time.isoformat(),
            "total_tests": test_run.total_tests,
            "passed": test_run.passed,
            "failed": test_run.failed,
            "errors": test_run.errors,
            "skipped": test_run.skipped,
            "pass_rate": (test_run.passed / test_run.total_tests * 100) if test_run.total_tests > 0 else 0,
            "results": [
                {
                    "test_case_id": r.test_case_id,
                    "status": r.status,
                    "passed": r.passed,
                    "duration_ms": r.duration_ms
                }
                for r in results
            ]
        }
        
        with open(run_dir / "summary.json", "w") as f:
            json.dump(summary, f, indent=2)
    
    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Load a test run by ID."""
        run_dir = self.runs_dir / run_id
        if not run_dir.exists():
            return None
        
        metadata_file = run_dir / "metadata.json"
        if not metadata_file.exists():
            return None
        
        with open(metadata_file) as f:
            return json.load(f)
    
    def get_run_results(self, run_id: str) -> List[Dict[str, Any]]:
        """Load all results for a test run."""
        run_dir = self.runs_dir / run_id
        if not run_dir.exists():
            return []
        
        results = []
        for result_file in run_dir.glob("*.json"):
            if result_file.name in ["metadata.json", "summary.json"]:
                continue
            
            with open(result_file) as f:
                results.append(json.load(f))
        
        return results
    
    def get_test_case_history(
        self,
        test_case_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get historical results for a specific test case."""
        results = []
        
        # Search all runs
        for run_dir in sorted(self.runs_dir.iterdir(), reverse=True):
            if not run_dir.is_dir():
                continue
            
            result_file = run_dir / f"{test_case_id}.json"
            if result_file.exists():
                with open(result_file) as f:
                    result = json.load(f)
                    results.append(result)
                
                if len(results) >= limit:
                    break
        
        return results
    
    def list_runs(
        self,
        suite_name: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """List recent test runs."""
        runs = []
        
        for run_dir in sorted(self.runs_dir.iterdir(), reverse=True):
            if not run_dir.is_dir():
                continue
            
            metadata_file = run_dir / "metadata.json"
            if not metadata_file.exists():
                continue
            
            with open(metadata_file) as f:
                metadata = json.load(f)
            
            # Filter by suite name if specified
            if suite_name and metadata.get("suite_name") != suite_name:
                continue
            
            runs.append(metadata)
            
            if len(runs) >= limit:
                break
        
        return runs
    
    def get_summary(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Load summary for a test run."""
        summary_file = self.runs_dir / run_id / "summary.json"
        if not summary_file.exists():
            return None
        
        with open(summary_file) as f:
            return json.load(f)
    
    def export_results(
        self,
        run_id: str,
        output_file: str,
        format: str = "json"
    ) -> None:
        """Export test results to a file."""
        metadata = self.get_run(run_id)
        results = self.get_run_results(run_id)
        summary = self.get_summary(run_id)
        
        export_data = {
            "metadata": metadata,
            "summary": summary,
            "results": results
        }
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if format == "json":
            with open(output_path, "w") as f:
                json.dump(export_data, f, indent=2)
        elif format == "html":
            # Generate HTML report
            html = self._generate_html_report(export_data)
            with open(output_path, "w") as f:
                f.write(html)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _generate_html_report(self, data: Dict[str, Any]) -> str:
        """Generate HTML report."""
        summary = data["summary"]
        results = data["results"]
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Test Results - {summary['run_id']}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .summary {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
        .passed {{ color: green; }}
        .failed {{ color: red; }}
        .error {{ color: orange; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
    </style>
</head>
<body>
    <h1>Test Results: {summary['suite_name']}</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Run ID:</strong> {summary['run_id']}</p>
        <p><strong>Timestamp:</strong> {summary['timestamp']}</p>
        <p><strong>Total Tests:</strong> {summary['total_tests']}</p>
        <p class="passed"><strong>Passed:</strong> {summary['passed']}</p>
        <p class="failed"><strong>Failed:</strong> {summary['failed']}</p>
        <p class="error"><strong>Errors:</strong> {summary['errors']}</p>
        <p><strong>Pass Rate:</strong> {summary['pass_rate']:.1f}%</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Case</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Metrics</th>
        </tr>
"""
        
        for result in results:
            status_class = result['status']
            duration = f"{result.get('duration_ms', 0):.0f}ms" if result.get('duration_ms') else "N/A"
            
            metrics_html = ""
            for metric in result.get('metrics', []):
                metric_status = "✅" if metric['passed'] else "❌"
                metrics_html += f"{metric_status} {metric['name']}: {metric['score']:.2f}<br>"
            
            html += f"""
        <tr>
            <td>{result['test_case_id']}</td>
            <td class="{status_class}">{result['status']}</td>
            <td>{duration}</td>
            <td>{metrics_html}</td>
        </tr>
"""
        
        html += """
    </table>
</body>
</html>
"""
        return html
