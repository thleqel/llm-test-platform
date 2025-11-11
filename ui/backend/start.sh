#!/bin/bash

# UI Backend Start Script
# Starts the LLM Test Framework UI Backend service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting UI Backend..."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if DeepEval service is running
echo "🔍 Checking DeepEval service..."
DEEPEVAL_URL="${DEEPEVAL_SERVICE_URL:-http://localhost:8001}"
if ! curl -sf "$DEEPEVAL_URL/health" > /dev/null 2>&1; then
    echo "⚠️  Warning: DeepEval service not available at $DEEPEVAL_URL"
    echo "   Start it with: cd ../../service && docker-compose up -d"
    echo "   Or run: ./start.sh from project root"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ DeepEval service is running"
fi

# Set default environment variables if not set
export DEEPEVAL_SERVICE_URL="${DEEPEVAL_SERVICE_URL:-http://localhost:8001}"
export TEST_ARTIFACTS_DIR="${TEST_ARTIFACTS_DIR:-../../test_artifacts}"
export TEST_RESULTS_DIR="${TEST_RESULTS_DIR:-../../test_results}"
export MAX_CONCURRENCY="${MAX_CONCURRENCY:-10}"

# Start the server
PORT="${PORT:-8002}"
echo ""
echo "✨ Starting UI Backend on http://localhost:$PORT"
echo "📚 API Documentation: http://localhost:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn main:app --reload --port "$PORT" --host 0.0.0.0
