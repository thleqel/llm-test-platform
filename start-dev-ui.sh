#!/bin/bash

# Start Development Environment for UI (Frontend + Backend)
# This script starts both the UI backend and frontend in development mode

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/ui/backend"
FRONTEND_DIR="$PROJECT_ROOT/ui/frontend"

echo "🚀 Starting LLM Test Platform UI Development Environment..."
echo "============================================================"

# Check if required directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "✅ Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if ports are available
if check_port 8002; then
    echo "⚠️  Port 8002 is already in use (Backend)"
    echo "   Kill the process? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        lsof -ti:8002 | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        exit 1
    fi
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is already in use (Frontend)"
    echo "   Kill the process? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
fi

# Start Backend
echo ""
echo "📦 Starting UI Backend (port 8002)..."
cd "$BACKEND_DIR"

# Check if venv exists
if [ ! -d ".venv" ]; then
    echo "❌ Backend virtual environment not found. Creating..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    # Install framework in editable mode
    pip install -e ../../framework
else
    source .venv/bin/activate
fi

# Start backend in background
nohup .venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8002 > /tmp/ui-backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo "   Logs: tail -f /tmp/ui-backend.log"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if check_port 8002; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

if ! check_port 8002; then
    echo "❌ Backend failed to start. Check logs: /tmp/ui-backend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start Frontend
echo ""
echo "🎨 Starting UI Frontend (port 3000)..."
cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
nohup npm run dev > /tmp/ui-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo "   Logs: tail -f /tmp/ui-frontend.log"

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..60}; do
    if check_port 3000; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
done

if ! check_port 3000; then
    echo "❌ Frontend failed to start. Check logs: /tmp/ui-frontend.log"
    cleanup
    exit 1
fi

echo ""
echo "============================================================"
echo "✨ Development environment is ready!"
echo "============================================================"
echo ""
echo "🌐 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:8002"
echo "📚 API Docs:  http://localhost:8002/docs"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/ui-backend.log"
echo "   Frontend: tail -f /tmp/ui-frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================================"
echo ""

# Keep script running and display logs
tail -f /tmp/ui-backend.log /tmp/ui-frontend.log
