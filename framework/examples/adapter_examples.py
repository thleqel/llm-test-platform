"""Example: Using specific adapters."""

import asyncio
from llm_test_framework import (
    AdapterFactory,
    TestCase,
    TestExecutor,
    DeepEvalClient
)


async def test_http_adapter():
    """Example using HTTP adapter."""
    print("\n=== HTTP API Adapter Example ===\n")
    
    # Create test case with HTTP adapter
    test_case = TestCase(
        id="http_example",
        name="HTTP API Test",
        input="What is AI?",
        expected_output="Artificial Intelligence",
        metrics=["answer_relevancy"],
        adapter={
            "type": "http_api",
            "config": {
                "endpoint": "http://localhost:5000/api/chat",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "request_body": {
                    "message": "{{input}}",
                    "session_id": "test"
                },
                "response_path": "data.response",
                "timeout": 30
            }
        }
    )
    
    # Execute
    async with DeepEvalClient() as client:
        executor = TestExecutor(deepeval_client=client)
        result = await executor.execute_test_case(test_case, "example_run")
        
        print(f"Status: {result.status}")
        print(f"Actual Output: {result.actual_output}")
        if result.metrics:
            for metric in result.metrics:
                print(f"{metric.name}: {metric.score:.2f}")


async def test_mock_adapter():
    """Example using Mock adapter."""
    print("\n=== Mock Adapter Example ===\n")
    
    # Create test case with mock adapter
    test_case = TestCase(
        id="mock_example",
        name="Mock Test",
        input="Test input",
        expected_output="Mocked response",
        metrics=["answer_relevancy"],
        adapter={
            "type": "mock",
            "config": {
                "actual_output": "This is a mocked response for testing purposes"
            }
        }
    )
    
    # Execute
    async with DeepEvalClient() as client:
        executor = TestExecutor(deepeval_client=client)
        result = await executor.execute_test_case(test_case, "example_run")
        
        print(f"Status: {result.status}")
        print(f"Actual Output: {result.actual_output}")
        if result.metrics:
            for metric in result.metrics:
                print(f"{metric.name}: {metric.score:.2f}")


async def main():
    """Run adapter examples."""
    
    # Test mock adapter (always works)
    await test_mock_adapter()
    
    # Test HTTP adapter (requires running service)
    # Uncomment if you have a service running:
    # await test_http_adapter()


if __name__ == "__main__":
    asyncio.run(main())
