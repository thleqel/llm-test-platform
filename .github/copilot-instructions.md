# LLM Test Platform - AI Coding Agent Instructions

## Architecture Overview

This is a **3-tier LLM testing platform** for evaluating AI applications with flexible trigger system:

1. **framework/** - Python test framework with 7 trigger adapter types (HTTP, Playwright, Python functions, LangChain, WebSocket, Shell, Mock)
2. **service/** - DeepEval evaluation service (FastAPI + Ollama) exposing REST API for LLM metrics
3. **ui/** - Web interface (React frontend + FastAPI backend) for test management and visualization

**Critical data flow**: Test YAML → Trigger adapter executes → Gets `actual_output` → DeepEval service evaluates → Results stored in `test_results/`

**Key separation**: `test_artifacts/` (version-controlled test definitions) vs `test_results/` (runtime data, gitignored)

## Project-Specific Patterns

### Trigger System
All adapters extend `BaseTriggerAdapter` (in `framework/llm_test_framework/adapters/base.py`):
- Must implement `async execute(test_case, context) -> AdapterResult`
- Return `AdapterResult(actual_output, metadata, success, error)`
- Support `{{variable}}` substitution via `_substitute_variables()`
- Register in `AdapterFactory._adapters` dict

Example: Mock adapter uses `fixture_file` config to load responses from `test_artifacts/fixtures/`

### Test Suite YAML Structure
```yaml
version: "1.0"
metadata:
  name: "Suite Name"
default_adapter:      # Applied to all tests unless overridden
  type: "http_api"
  config:
    endpoint: "http://..."
test_cases:
  - id: "tc_001"     # Unique identifier
    input: "..."     # LLM input
    expected_output: "..."
    adapter:         # Per-test override
      type: "mock"
      config: {...}
    metrics: ["answer_relevancy", "faithfulness"]
    thresholds:      # Custom pass/fail thresholds
      answer_relevancy: 0.7
```

### CLI Tool Installation
Framework installs as `llm-test` command (see `framework/setup.py` entry_points):
```bash
cd framework && pip install -e .
llm-test run <suite.yml> --test-ids tc_001,tc_002
```

### Result Storage Pattern
`FileResultStore` (in `framework/llm_test_framework/storage/file_store.py`) uses structure:
```
test_results/
  runs/<run_id>/
    run.json          # TestRun metadata
    results.json      # List of TestResult objects
  cache/<test_id>/    # Historical results per test
```

## Development Workflows

### Running Services Locally (Without Docker)
```bash
# Terminal 1: Ollama (required for DeepEval)
ollama serve
ollama pull llama3.2:1b

# Terminal 2: DeepEval Service
cd service && source .venv/bin/activate
uvicorn main:app --reload --port 8001

# Terminal 3: UI Backend
cd ui/backend && source .venv/bin/activate
uvicorn main:app --reload --port 8002

# Terminal 4: UI Frontend
cd ui/frontend && npm run dev  # localhost:3000
```

**Critical**: Service dependencies require Ollama → DeepEval → UI Backend chain

### Running Tests
```bash
# Framework unit tests (uses mock adapter)
cd framework && python examples/run_tests.py

# Service API tests (requires service running)
cd service && pytest tests/ -v

# CLI testing
llm-test validate test_artifacts/test_suites/mock_example.yml
llm-test run test_artifacts/test_suites/mock_example.yml
```

### Docker Compose Structure
Root `docker-compose.yml` orchestrates all services:
- `ollama` (port 11434) - LLM inference
- `deepeval-service` (port 8001) - Evaluation API
- `ui-backend` (port 8002) - Test management API
- `ui-frontend` (port 3000) - Web UI

Start all: `docker-compose up -d` or use `./start.sh`

## Key Integration Points

### DeepEval Client Usage
`DeepEvalClient` (in `framework/llm_test_framework/client/deepeval_client.py`) wraps HTTP calls:
```python
async with DeepEvalClient(base_url="http://localhost:8001") as client:
    result = await client.evaluate_single(
        input=test_case.input,
        actual_output=adapter_result.actual_output,
        metrics=test_case.metrics
    )
```

### Parallel Execution
`ParallelTestRunner` (in `framework/llm_test_framework/runner/parallel_runner.py`):
- Uses `asyncio.Semaphore` for concurrency control (default: 10)
- Each test runs in isolated `TestExecutor` with adapter setup/teardown
- Results streamed to callbacks for real-time UI updates

### WebSocket Events (UI)
Backend broadcasts test progress via WebSocket at `/ws/test-execution/{run_id}`:
```python
# Event types: "test_started", "test_completed", "run_completed"
await manager.send_test_update(run_id, {
    "event": "test_completed",
    "test_case_id": "tc_001",
    "result": {...}
})
```

## Testing Conventions

### Service Tests
Located in `service/tests/`, use pytest with `ServiceTestHelper` utility class:
- `conftest.py` provides shared fixtures
- `utils.py` contains `SAMPLE_PAYLOADS` and schema validators
- Tests require service running (checks with `is_service_healthy()`)

### Adapter Testing
Use mock adapter for framework tests (no external dependencies):
```yaml
adapter:
  type: "mock"
  config:
    actual_output: "Mocked response"  # Or fixture_file path
```

## Common Pitfalls

1. **Port conflicts**: DeepEval uses 8001, UI backend 8002, frontend 3000 - check `DEVELOPMENT.md` for full list
2. **Adapter config naming**: Use `adapter.config` not `adapter.settings` in YAML
3. **Test case IDs**: Must be unique across suite; used as primary key in results
4. **Metrics validation**: Service validates metric names against DeepEval registry (see `/api/v1/evaluation/metrics`)
5. **Async context**: All adapter `execute()` methods must be async; use `await` for DeepEval calls

## File Naming Patterns

- Test suites: `*_example.yml` or `*_tests.yml` in `test_artifacts/test_suites/`
- Fixtures: Plain text in `test_artifacts/fixtures/` (referenced by filename in mock adapter)
- Trigger adapters: `*_adapter.py` in `framework/llm_test_framework/adapters/`
- Example scripts: `*_examples.py` or `run_*.py` in `framework/examples/`

## When Adding New Features

- **New trigger adapter**: Extend `BaseTriggerAdapter`, register in `AdapterFactory`, add example YAML
- **New metric**: Configure in DeepEval service `src/routers/evaluation.py` metric registry
- **New CLI command**: Add `@cli.command()` in `framework/llm_test_framework/cli/main.py`
- **New API endpoint**: Add router in `ui/backend/routers/` and import in `main.py`

## Quick Reference

- Start everything: `./start.sh` (root)
- Run quick test: `cd framework && python examples/run_tests.py`
- CLI help: `llm-test --help`
- API docs: http://localhost:8001/docs (DeepEval), http://localhost:8002/docs (UI Backend)
- View results: http://localhost:3000 (Web UI)
