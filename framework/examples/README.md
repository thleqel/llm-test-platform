# Framework Examples

This directory contains example scripts demonstrating how to use the LLM Test Framework.

## Examples

### 1. `run_tests.py`
Complete example of loading and running a test suite.

```bash
python examples/run_tests.py
```

### 2. `load_suites.py`
Example of loading and inspecting test suites without running them.

```bash
python examples/load_suites.py
```

### 3. `adapter_examples.py`
Examples of using different adapters (HTTP, Mock, etc.).

```bash
python examples/adapter_examples.py
```

## Prerequisites

1. **Install Framework**
   ```bash
   pip install -e .
   ```

2. **Start DeepEval Service** (for evaluation)
   ```bash
   cd ../service
   docker-compose up -d
   ```

3. **Start Your LLM App** (for HTTP/Playwright adapters)
   ```bash
   # Your application should be running on the configured endpoint
   # e.g., http://localhost:5000/api/chat
   ```

## Running Examples

### Basic Run
```bash
# Run with mock adapter (no external dependencies)
python examples/run_tests.py
```

### With Your API
1. Update `test_artifacts/test_suites/http_api_example.yml` with your endpoint
2. Run: `python examples/run_tests.py`

### With UI Testing
1. Ensure your web app is running
2. Update `test_artifacts/test_suites/playwright_example.yml`
3. Install Playwright: `playwright install chromium`
4. Run tests

## Creating Your Own Tests

1. **Create Test Suite**
   ```yaml
   # test_artifacts/test_suites/my_tests.yml
   version: "1.0"
   metadata:
     name: "My Tests"
   
   test_cases:
     - id: "tc_001"
       input: "Test question"
       expected_output: "Expected answer"
       adapter:
         type: "http_api"
         config:
           endpoint: "http://localhost:5000/api/chat"
       metrics: ["answer_relevancy"]
   ```

2. **Run Your Tests**
   ```python
   from llm_test_framework import YAMLLoader, ParallelTestRunner, DeepEvalClient
   
   suite = YAMLLoader.load_suite("test_artifacts/test_suites/my_tests.yml")
   
   async with DeepEvalClient() as client:
       runner = ParallelTestRunner(client)
       run, results = await runner.run_tests(suite.test_cases, suite.name)
   ```
