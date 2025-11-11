# Tests for DeepEval Service

This directory contains all tests for the DeepEval Service application.

> **📝 For complete testing instructions, see the [Testing section](../README.md#-testing) in the main README.**

## Test Structure

- `test_api.py` - API endpoint tests
- `test_models.py` - Data model validation tests  
- `test_service.py` - DeepEval service functionality tests
- `test_integration.py` - Full integration tests
- `test_threshold.py` - Custom threshold functionality tests
- `conftest.py` - Pytest configuration and fixtures
- `utils.py` - Test utilities and helpers

## Running Tests

### Run All Tests
```bash
# From project root
python -m pytest tests/

# With verbose output
python -m pytest tests/ -v

# With coverage
python -m pytest tests/ --cov=src
```

### Run Specific Test Files
```bash
# API tests only
python -m pytest tests/test_api.py -v

# Service tests only  
python -m pytest tests/test_service.py -v

# Integration tests only
python -m pytest tests/test_integration.py -v
```

### Run Individual Tests
```bash
# Specific test function
python -m pytest tests/test_api.py::test_single_evaluation -v

# Tests matching pattern
python -m pytest tests/ -k "threshold" -v
```

## Test Requirements

The tests require the following:
- Service running on `http://localhost:8001`
- Ollama running on `http://localhost:11434`
- Docker Compose setup active

## Quick Health Check

Run the integration test to verify everything is working:
```bash
python tests/test_integration.py
```