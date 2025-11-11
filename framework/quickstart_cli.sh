#!/bin/bash
# Quick start script for CLI

set -e

echo "=== LLM Test Framework - CLI Quick Start ==="
echo ""

# Install framework
echo "1. Installing framework..."
pip install -e . > /dev/null 2>&1
echo "   ✓ Installed"
echo ""

# List test suites
echo "2. Listing available test suites..."
llm-test list-suites ../test_artifacts/test_suites
echo ""

# Validate a test suite
echo "3. Validating test suite..."
llm-test validate ../test_artifacts/test_suites/mock_example.yml
echo ""

# Show help
echo "4. Available commands:"
llm-test --help
echo ""

echo "=== Ready to test! ==="
echo ""
echo "Try these commands:"
echo "  llm-test run ../test_artifacts/test_suites/mock_example.yml"
echo "  llm-test list-runs"
echo "  llm-test history <test-case-id>"
echo ""
