# CLI Examples

## Basic Commands

### Run Tests

```bash
# Run entire test suite
llm-test run test_artifacts/test_suites/http_api_example.yml

# Run specific test cases
llm-test run test_artifacts/test_suites/http_api_example.yml --test-ids tc_001,tc_002

# Run with custom concurrency
llm-test run test_artifacts/test_suites/http_api_example.yml --max-concurrency 5

# Run and export results to HTML
llm-test run test_artifacts/test_suites/http_api_example.yml --export report.html

# Run and export to JSON
llm-test run test_artifacts/test_suites/http_api_example.yml --export results.json --export-format json
```

### List Test Runs

```bash
# List recent runs
llm-test list-runs

# List runs for specific suite
llm-test list-runs --suite "HTTP API Tests"

# List more runs
llm-test list-runs --limit 20
```

### View Test History

```bash
# Show history for a test case
llm-test history tc_001

# Show more history
llm-test history tc_001 --limit 10
```

### Export Results

```bash
# Export to HTML
llm-test export <run-id> report.html

# Export to JSON
llm-test export <run-id> results.json --format json
```

### Validate Test Suite

```bash
# Validate YAML syntax and structure
llm-test validate test_artifacts/test_suites/http_api_example.yml
```

### List Test Suites

```bash
# List all test suites in directory
llm-test list-suites test_artifacts/test_suites
```

## Common Workflows

### Development Workflow

```bash
# 1. Validate your test suite
llm-test validate test_artifacts/test_suites/my_tests.yml

# 2. Run tests
llm-test run test_artifacts/test_suites/my_tests.yml

# 3. View specific test history
llm-test history tc_001

# 4. Export report for review
llm-test export <run-id> report.html
```

### CI/CD Workflow

```bash
# Run all tests and export results
llm-test run test_artifacts/test_suites/production.yml --export ci-results.html

# Exit code indicates pass/fail
if [ $? -eq 0 ]; then
  echo "Tests passed"
else
  echo "Tests failed"
fi
```

### Debugging Workflow

```bash
# Run single test with high verbosity
llm-test run test_artifacts/test_suites/debug.yml --test-ids tc_001

# Check history to see when test started failing
llm-test history tc_001 --limit 10
```

## Advanced Usage

### Custom DeepEval Service

```bash
# Use remote DeepEval service
llm-test run tests.yml --deepeval-url http://remote-host:8001
```

### Filtering Tests

```bash
# Run multiple specific tests
llm-test run tests.yml --test-ids tc_001,tc_002,tc_005

# Run tests from different suites
llm-test run suite1.yml --test-ids tc_001
llm-test run suite2.yml --test-ids tc_010
```

## Output Examples

### Run Command Output

```
Test Suite: HTTP API Tests
Total Tests: 5

✓ DeepEval service is running

Running 5 tests...

╭───────────────┬────────────┬──────────────────────────┬──────────╮
│ Test Case     │ Status     │ Metrics                  │ Duration │
├───────────────┼────────────┼──────────────────────────┼──────────┤
│ api_001       │ ✓ passed   │ answer_relevancy: 0.89   │   1234ms │
│ api_002       │ ✓ passed   │ answer_relevancy: 0.85   │   1567ms │
│ api_003       │ ✗ failed   │ answer_relevancy: 0.65   │   1890ms │
│ api_004       │ ✓ passed   │ faithfulness: 0.92       │   2103ms │
│ api_005       │ ⊘ skipped  │ -                        │        - │
╰───────────────┴────────────┴──────────────────────────┴──────────╯

Results saved to: test_results/runs/8a7d3f2e-4b5c-4d6e-8f9g-0h1i2j3k4l5m/
```

### List Runs Output

```
╭──────────────┬─────────────────┬─────────────────────┬───────┬────────┬────────╮
│ Run ID       │ Suite           │ Timestamp           │ Total │ Passed │ Failed │
├──────────────┼─────────────────┼─────────────────────┼───────┼────────┼────────┤
│ 8a7d3f2e...  │ HTTP API Tests  │ 2025-11-10 14:30:22 │    10 │      8 │      2 │
│ 7b6c5d4e...  │ UI Tests        │ 2025-11-10 13:15:10 │     5 │      5 │      0 │
│ 6a5b4c3d...  │ HTTP API Tests  │ 2025-11-10 11:45:33 │    10 │      9 │      1 │
╰──────────────┴─────────────────┴─────────────────────┴───────┴────────┴────────╯
```

### History Output

```
History for tc_001

╭─────────────────────┬────────┬──────────────────────────────┬──────────╮
│ Timestamp           │ Status │ Metrics                      │ Duration │
├─────────────────────┼────────┼──────────────────────────────┼──────────┤
│ 2025-11-10 14:30:22 │ ✓      │ ✓ answer_relevancy: 0.89     │   1234ms │
│ 2025-11-10 13:15:10 │ ✓      │ ✓ answer_relevancy: 0.87     │   1456ms │
│ 2025-11-10 11:45:33 │ ✗      │ ✗ answer_relevancy: 0.62     │   1567ms │
│ 2025-11-09 16:20:45 │ ✓      │ ✓ answer_relevancy: 0.91     │   1234ms │
╰─────────────────────┴────────┴──────────────────────────────┴──────────╯
```

## Help

```bash
# General help
llm-test --help

# Command-specific help
llm-test run --help
llm-test list-runs --help
llm-test history --help
```
