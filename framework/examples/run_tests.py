"""Example: Running tests with the framework."""

import asyncio
from pathlib import Path

from llm_test_framework import (
    YAMLLoader,
    ParallelTestRunner,
    DeepEvalClient,
    FileResultStore
)


async def main():
    """Run example tests."""
    
    # Load test suite
    suite_path = Path(__file__).parent.parent / "test_artifacts" / "test_suites" / "mock_example.yml"
    print(f"Loading test suite: {suite_path}")
    suite = YAMLLoader.load_suite(suite_path)
    
    print(f"\nTest Suite: {suite.name}")
    print(f"Test Cases: {len(suite.test_cases)}")
    
    # Create DeepEval client
    async with DeepEvalClient(base_url="http://localhost:8001") as client:
        # Check service health
        is_healthy = await client.health_check()
        if not is_healthy:
            print("\n❌ DeepEval service is not running!")
            print("Start it with: cd service && docker-compose up -d")
            return
        
        print("\n✅ DeepEval service is running")
        
        # Create result store
        result_store = FileResultStore()
        
        # Create runner
        runner = ParallelTestRunner(
            deepeval_client=client,
            max_concurrency=5,
            default_adapter=suite.default_adapter,
            result_store=result_store
        )
        
        # Run tests
        print(f"\n🚀 Running {len(suite.test_cases)} tests...\n")
        
        test_run, results = await runner.run_tests(
            test_cases=suite.test_cases,
            suite_name=suite.name
        )
        
        # Print results
        print(f"\n{'='*60}")
        print(f"Test Run: {test_run.id}")
        print(f"Duration: {(test_run.end_time - test_run.start_time).total_seconds():.2f}s")
        print(f"{'='*60}")
        print(f"Total:   {test_run.total_tests}")
        print(f"✅ Passed:  {test_run.passed}")
        print(f"❌ Failed:  {test_run.failed}")
        print(f"⚠️  Errors:  {test_run.errors}")
        print(f"⏭️  Skipped: {test_run.skipped}")
        print(f"{'='*60}\n")
        
        # Detailed results
        for result in results:
            status_icon = {
                "passed": "✅",
                "failed": "❌",
                "error": "⚠️",
                "skipped": "⏭️"
            }.get(result.status, "❓")
            
            print(f"{status_icon} {result.test_case_id}: {result.status}")
            
            if result.actual_output:
                print(f"   Output: {result.actual_output[:100]}...")
            
            if result.metrics:
                for metric in result.metrics:
                    metric_icon = "✅" if metric.passed else "❌"
                    print(f"   {metric_icon} {metric.name}: {metric.score:.2f} (threshold: {metric.threshold})")
            
            if result.error:
                print(f"   Error: {result.error}")
            
            print()
        
        # Show where results are saved
        print(f"\n💾 Results saved to: test_results/runs/{test_run.id}/")
        print(f"   - metadata.json  (run info)")
        print(f"   - summary.json   (summary)")
        print(f"   - *.json         (individual results)")


if __name__ == "__main__":
    asyncio.run(main())
