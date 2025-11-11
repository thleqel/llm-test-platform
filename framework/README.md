# LLM Test Framework

Python framework for testing LLM applications with a flexible trigger system (7 adapter types) and DeepEval integration.

## Installation

```bash
pip install -e .

# Install optional dependencies
pip install -e ".[dev,cli]"

# Install Playwright (if using UI adapter)
playwright install chromium
```

## Quick Start

### Using CLI (Recommended)

```bash
# Install framework
cd framework
pip install -e .

# List available test suites
llm-test list-suites test_artifacts/test_suites

# Validate test suite
llm-test validate test_artifacts/test_suites/mock_example.yml

# Run tests
llm-test run test_artifacts/test_suites/mock_example.yml

# Run specific tests
llm-test run test_artifacts/test_suites/mock_example.yml --test-ids tc_001,tc_002

# List recent runs
llm-test list-runs

# View test history
llm-test history tc_001

# Export results to HTML
llm-test export <run-id> report.html

# Export results to JSON
llm-test export <run-id> results.json --format json
```

See [CLI Examples](examples/CLI_EXAMPLES.md) for complete documentation.

### Using Python API

### 1. Create Test Suite

```yaml
# test.yml
version: "1.0"
metadata:
  name: "My Tests"

test_cases:
  - id: "tc_001"
    name: "Basic test"
    input: "What is AI?"
    expected_output: "Artificial Intelligence"
    adapter:
      type: "mock"
      config:
        actual_output: "AI is Artificial Intelligence"
    metrics: ["answer_relevancy"]
```

### 2. Run Tests

```python
import asyncio
from llm_test_framework import YAMLLoader, ParallelTestRunner, DeepEvalClient

async def main():
    suite = YAMLLoader.load_suite("test.yml")
    
    async with DeepEvalClient() as client:
        runner = ParallelTestRunner(client)
        run, results = await runner.run_tests(suite.test_cases, suite.name)
        
        print(f"Passed: {run.passed}/{run.total_tests}")

asyncio.run(main())
```

## Trigger System

### HTTP API
```yaml
adapter:
  type: "http_api"
  config:
    endpoint: "http://localhost:5000/api/chat"
    method: "POST"
    request_body:
      message: "{{input}}"
    response_path: "data.response"
```

### Playwright (UI)
```yaml
adapter:
  type: "playwright"
  config:
    browser: "chromium"
    base_url: "http://localhost:3000"
    steps:
      - action: "goto"
        url: "/chat"
      - action: "fill"
        selector: "#input"
        value: "{{input}}"
      - action: "click"
        selector: "#submit"
      - action: "extract_text"
        selector: ".response"
        save_as: "actual_output"
```

### Python Function
```yaml
adapter:
  type: "python_function"
  config:
    module: "my_app.chatbot"
    function: "get_response"
    args:
      message: "{{input}}"
```

### Mock (for testing)
```yaml
adapter:
  type: "mock"
  config:
    actual_output: "Mocked response"
```

## Examples

See `examples/` directory for complete examples.

## Documentation

- [Getting Started](../docs/getting-started.md)
- [Trigger System & Adapters](../docs/adapters.md)
- [Test Case Format](../docs/test-cases.md)

## Requirements

- Python 3.10+
- DeepEval service running (for evaluation)
- Target application running (for HTTP/Playwright adapters)
