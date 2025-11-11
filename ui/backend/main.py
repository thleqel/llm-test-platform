"""FastAPI backend for LLM Test Framework UI."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from typing import List

from routers import test_artifacts, test_execution, test_results, configuration
from services.websocket_manager import ConnectionManager


# WebSocket manager for real-time updates
manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for FastAPI app."""
    # Startup
    print("🚀 Starting LLM Test Framework UI Backend...")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="LLM Test Framework API",
    description="REST API for managing and executing LLM tests",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(test_artifacts.router, prefix="/api/artifacts", tags=["Test Artifacts"])
app.include_router(test_execution.router, prefix="/api/execution", tags=["Test Execution"])
app.include_router(test_results.router, prefix="/api/results", tags=["Test Results"])
app.include_router(configuration.router, prefix="/api/config", tags=["Configuration"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "LLM Test Framework API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.websocket("/ws/test-execution/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    """WebSocket endpoint for real-time test execution updates."""
    await manager.connect(websocket, run_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back for now (could handle commands later)
            await manager.send_personal_message(
                {"type": "ack", "message": data},
                websocket
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket, run_id)
