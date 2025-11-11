# Development Quick Start

Quick commands for local development without Docker.

## Prerequisites

- Python 3.10+
- Node.js 20+
- Ollama installed locally

## Start Services Individually

### 1. Start Ollama (if not running)

```bash
ollama serve
```

In another terminal, pull the required model:
```bash
ollama pull llama3.2:1b
```

### 2. Start DeepEval Service

```bash
cd service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Service will be available at: http://localhost:8001

### 3. Start UI Backend

```bash
cd ui/backend
# Use the same venv as framework or create new one
source ../../.venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

API will be available at: http://localhost:8002
API docs at: http://localhost:8002/docs

### 4. Start UI Frontend

```bash
cd ui/frontend
npm install
npm run dev
```

Web UI will be available at: http://localhost:3000

## Using the CLI

Install the framework:
```bash
cd framework
pip install -e .
```

Run tests:
```bash
# List available suites
llm-test list-suites

# Run a test suite
llm-test run example-suite

# View recent runs
llm-test list-runs

# Export results
llm-test export <run-id> --format html
```

## Environment Variables

Create `.env` files in each service directory:

**service/.env**:
```
OLLAMA_BASE_URL=http://localhost:11434
LOG_LEVEL=info
```

**ui/backend/.env**:
```
DEEPEVAL_SERVICE_URL=http://localhost:8001
TEST_ARTIFACTS_DIR=../../test_artifacts
TEST_RESULTS_DIR=../../test_results
MAX_CONCURRENCY=10
```

**ui/frontend/.env.local**:
```
NEXT_PUBLIC_API_URL=http://localhost:8002
```

## Troubleshooting

### Port Already in Use

If you see "address already in use" errors, change the ports:

```bash
# DeepEval service
uvicorn main:app --reload --port 8011

# UI Backend
uvicorn main:app --reload --port 8012

# Frontend
npm run dev -- -p 3001
```

### Playwright Issues

Install browsers:
```bash
playwright install --with-deps chromium
```

### Module Not Found

Make sure you're in the correct directory and virtual environment is activated:
```bash
source .venv/bin/activate
pip install -e .
```

## Development Workflow

1. **Make changes to test cases**: 
   - Option A: Edit YAML files directly in `test_artifacts/test_suites/`
   - Option B: Use the Web UI editor (see below)
2. **Test via CLI**: `llm-test run your-suite`
3. **Test via UI**: Open browser to http://localhost:3000
4. **View results**: Check `test_results/` directory or use UI

### Creating Test Suites via UI

1. Navigate to http://localhost:3000/test-cases
2. Click the **New Suite** button in the top right
3. Fill in the suite creation form:
   - **Suite Name**: Name of the test suite (required)
   - **Description**: Purpose and scope of the suite
   - **Owner**: Team or person responsible (default: dev-team)
   - **Version**: Suite version (default: 1.0)
   - **Tags**: Comma-separated labels (e.g., `e2e, integration, critical`)
   - **Default Adapter**: Optional adapter that all tests will use by default
4. Click **Create Suite**
5. A new YAML file is created in `test_artifacts/test_suites/`
6. Filename is auto-generated from suite name (e.g., "E2E Tests" → `e2e_tests.yml`)
7. Suite starts empty - add test cases using "New Test Case" button

### Creating Test Cases via UI

1. Navigate to http://localhost:3000/test-cases
2. Click the **New Test Case** button in the top right
3. Fill in the creation form:
   - **Test Suite**: Select which suite to add the test to
   - **Name**: Test case name (required)
   - **Input**: Test input text (required)
   - **Expected Output**: Expected result (required)
   - **Context**: Optional JSON or plain text
   - **Metrics**: Comma-separated list (e.g., `answer_relevancy, faithfulness`)
   - **Tags**: Comma-separated list (e.g., `smoke, regression`)
   - **Adapter Type**: Select from dropdown (mock, http, playwright, etc.)
   - **Adapter Configuration**: JSON config specific to adapter type
4. Click **Create Test Case**
5. Test case is added to the selected suite's YAML file
6. A unique ID is auto-generated (e.g., `mock_tests_003`)

### Editing Test Cases via UI

1. Navigate to http://localhost:3000/test-cases
2. Click on any test case to view details
3. Click the **Edit** button in the top right
4. Modify fields in the modal (same fields as create)
5. Click **Save Changes**
6. Changes are immediately persisted to the YAML file

**Adapter Configuration Help**:
- Click "Show example configuration" in the blue info box for adapter-specific examples
- Examples include all required fields for each adapter type
- Use `${input}` in configs to inject test input dynamically

**Note**: Both create and edit functionality directly modify the YAML files in `test_artifacts/test_suites/`, so all changes are version-controllable via Git.

## Hot Reload

All services support hot reload:
- **Python services**: Use `--reload` flag with uvicorn
- **Next.js**: Automatic with `npm run dev`
- **Test artifacts**: Re-run tests to see changes

## Running Tests

### Framework Tests
```bash
cd framework
pytest tests/
```

### UI Backend Tests
```bash
cd ui/backend
pytest tests/
```

### Frontend Tests
```bash
cd ui/frontend
npm test
```
