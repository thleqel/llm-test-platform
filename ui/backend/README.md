# LLM Test Framework - UI Backend

FastAPI backend for the LLM Test Framework web interface.

## Features

- **REST API** for test management and execution
- **WebSocket** support for real-time test updates
- **File-based storage** integration
- **CORS** enabled for frontend communication
- **Background tasks** for test execution

## Installation

```bash
cd ui/backend
pip install -r requirements.txt
```

## Running

```bash
# Development server with auto-reload
uvicorn main:app --reload --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Test Artifacts

- `GET /api/artifacts/suites` - List all test suites
- `GET /api/artifacts/suites/{suite_name}` - Get specific suite
- `GET /api/artifacts/test-cases` - List test cases (with filters)
- `GET /api/artifacts/test-cases/{test_case_id}` - Get specific test case
- `POST /api/artifacts/suites/upload` - Upload new test suite
- `GET /api/artifacts/adapters` - List available trigger adapter types

### Test Execution

- `POST /api/execution/run` - Start test execution
- `GET /api/execution/runs/{run_id}/status` - Get run status
- `GET /api/execution/runs/active` - List active runs
- `POST /api/execution/runs/{run_id}/cancel` - Cancel running test
- `GET /api/execution/health/deepeval` - Check DeepEval service health

### Test Results

- `GET /api/results/runs` - List recent runs
- `GET /api/results/runs/{run_id}` - Get run details
- `GET /api/results/runs/{run_id}/summary` - Get run summary
- `GET /api/results/runs/{run_id}/results` - Get all results for run
- `GET /api/results/test-cases/{test_case_id}/history` - Get test history
- `GET /api/results/runs/{run_id}/export/html` - Export as HTML
- `GET /api/results/runs/{run_id}/export/json` - Export as JSON
- `GET /api/results/stats/overview` - Get overview statistics
- `GET /api/results/stats/by-suite` - Get stats by suite

### Configuration

- `GET /api/config/` - Get all configuration
- `GET /api/config/{key}` - Get specific config value
- `PUT /api/config/` - Update configuration
- `POST /api/config/reset` - Reset to defaults

### WebSocket

- `WS /ws/test-execution/{run_id}` - Real-time test updates

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## WebSocket Events

### Client → Server
```json
{"type": "subscribe", "run_id": "..."}
```

### Server → Client

Test result update:
```json
{
  "type": "test_result",
  "run_id": "...",
  "data": { "test_case_id": "...", "status": "passed", ... }
}
```

Run status update:
```json
{
  "type": "run_status",
  "run_id": "...",
  "status": "completed",
  "summary": { "total": 10, "passed": 8, ... }
}
```

## Configuration

Default configuration in `../config/ui_config.json`:

```json
{
  "deepeval": {
    "url": "http://localhost:8001",
    "timeout": 30
  },
  "execution": {
    "max_concurrency": 10
  },
  "storage": {
    "results_dir": "../test_results",
    "artifacts_dir": "../test_artifacts"
  }
}
```

## Development

```bash
# Install dev dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload

# Run tests
pytest
```
