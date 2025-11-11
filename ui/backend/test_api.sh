#!/bin/bash
# Test the UI Backend API

BASE_URL="http://localhost:8002"

echo "=== Testing LLM Test Framework UI Backend ==="
echo ""

# Test health endpoint
echo "1. Health Check:"
curl -s "$BASE_URL/health" | python -m json.tool
echo ""

# Test root endpoint
echo "2. Root Endpoint:"
curl -s "$BASE_URL/" | python -m json.tool
echo ""

# Test list suites
echo "3. List Test Suites:"
curl -s "$BASE_URL/api/artifacts/suites" | python -m json.tool
echo ""

# Test list trigger adapter types
echo "4. List Trigger Adapter Types:"
curl -s "$BASE_URL/api/artifacts/adapters" | python -m json.tool
echo ""

# Test get config
echo "5. Get Configuration:"
curl -s "$BASE_URL/api/config/" | python -m json.tool
echo ""

# Test list results
echo "6. List Recent Runs:"
curl -s "$BASE_URL/api/results/runs?limit=5" | python -m json.tool
echo ""

# Test stats overview
echo "7. Get Stats Overview:"
curl -s "$BASE_URL/api/results/stats/overview" | python -m json.tool
echo ""

echo "=== All tests complete ==="
echo ""
echo "Visit http://localhost:8002/docs for interactive API documentation"
