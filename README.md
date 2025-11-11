# LLM Test Platform

Complete test automation platform for LLM applications with flexible trigger system, comprehensive evaluation metrics, and web UI.

## 🏗️ Architecture

```
llm-test-platform/
├── service/              # DeepEval evaluation service (FastAPI + Ollama)
├── framework/            # Python test framework with trigger system
├── ui/                   # Web UI (React + FastAPI backend)
├── test_artifacts/       # Version-controlled test definitions
├── test_results/         # Runtime results (not version controlled)
└── docs/                 # Documentation
```

## 🚀 Quick Start

### 1. Start DeepEval Service

```bash
cd service
docker-compose up -d
```

### 2. Install Framework

```bash
cd framework
pip install -e .
playwright install chromium  # If using Playwright adapter
```

### 3. Run Example Tests

```bash
python examples/run_tests.py
```

## 📋 Features

### Trigger System (7 Adapter Types)
- **HTTP API** - REST API testing
- **Playwright** - UI automation testing
- **Python Functions** - Direct function calls
- **LangChain** - Chain integration
- **WebSocket** - Real-time communication
- **Shell Scripts** - CLI tool testing
- **Mock** - Unit testing with fixtures

### Evaluation Metrics (via DeepEval)
- Answer Relevancy
- Faithfulness
- Contextual Precision/Recall
- Hallucination Detection
- Bias & Toxicity
- And more...

### Parallel Execution
- Concurrent test execution
- Configurable concurrency limits
- Isolated execution contexts
- No race conditions

### Version Control
- Test definitions in YAML
- Git-tracked test artifacts
- Separate runtime results
- Baseline comparison

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Trigger System & Adapters](docs/adapters.md)
- [Test Case Format](docs/test-cases.md)
- [CLI Usage](docs/cli.md)
- [API Reference](docs/api-reference.md)

## 🎯 Example Test Suite

```yaml
version: "1.0"
metadata:
  name: "Customer Support Tests"

default_adapter:
  type: "http_api"
  config:
    endpoint: "http://localhost:5000/api/chat"

test_cases:
  - id: "tc_001"
    name: "Password Reset"
    input: "How do I reset my password?"
    expected_output: "Click 'Forgot Password' on login page"
    metrics: ["answer_relevancy", "faithfulness"]
    thresholds:
      answer_relevancy: 0.7
```

## 🛠️ Components

### 1. DeepEval Service
REST API wrapping DeepEval with Ollama integration.

[Service README](service/README.md)

### 2. Test Framework
Python package with trigger system and test runner.

```python
from llm_test_framework import ParallelTestRunner, YAMLLoader, DeepEvalClient

# Load tests
suite = YAMLLoader.load_suite("test_artifacts/test_suites/example.yml")

# Run tests
client = DeepEvalClient()
runner = ParallelTestRunner(client, max_concurrency=10)
run, results = await runner.run_tests(suite.test_cases, suite.name)
```

### 3. Web UI
Next.js-based dashboard for test management and execution.

**Features:**
- 📊 Dashboard with test statistics and recent runs
- 📝 Test case management (view, edit, create)
- ▶️ Test execution with real-time updates
- 📈 Results visualization and history
- ⚙️ Configuration management
- 🔄 Live editing of test cases directly in the UI

```bash
cd ui
docker-compose up
```

Access at: http://localhost:3000

## 📦 Installation

### From Source

```bash
# Framework
cd framework
pip install -e ".[dev,cli]"

# Service
cd service
docker-compose up -d

# UI
cd ui
docker-compose up -d
```

## 🧪 Running Tests

### CLI

```bash
# Run all tests in a suite
llm-test run test_artifacts/test_suites/example.yml

# Run specific test cases
llm-test run --test-ids tc_001,tc_002

# Run with custom concurrency
llm-test run --max-concurrency 5
```

### Python API

```python
import asyncio
from llm_test_framework import (
    YAMLLoader,
    ParallelTestRunner,
    DeepEvalClient
)

async def run_tests():
    # Load suite
    suite = YAMLLoader.load_suite("test_artifacts/test_suites/example.yml")
    
    # Create client and runner
    async with DeepEvalClient() as client:
        runner = ParallelTestRunner(
            deepeval_client=client,
            max_concurrency=10,
            default_adapter=suite.default_adapter
        )
        
        # Execute
        run, results = await runner.run_tests(
            test_cases=suite.test_cases,
            suite_name=suite.name
        )
        
        # Print results
        print(f"Run: {run.id}")
        print(f"Passed: {run.passed}/{run.total_tests}")
        
        for result in results:
            print(f"  {result.test_case_id}: {result.status}")

asyncio.run(run_tests())
```

## 🔧 Configuration

### Environment Variables

```bash
# DeepEval Service
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
SERVICE_PORT=8001

# Framework
DEEPEVAL_SERVICE_URL=http://localhost:8001
MAX_CONCURRENCY=10

# UI
UI_BACKEND_PORT=8002
UI_FRONTEND_PORT=3000
```

## 📊 Results

Test results are stored separately from test definitions:

```
test_results/
├── runs/
│   └── run_20251110_143022/
│       ├── metadata.json        # Run info
│       ├── tc_001_result.json   # Individual results
│       └── summary.json         # Aggregated summary
├── database.db                  # SQLite with all results
└── screenshots/                 # Playwright artifacts
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🔗 Links

- [DeepEval Documentation](https://deepeval.com/)
- [Playwright Documentation](https://playwright.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
