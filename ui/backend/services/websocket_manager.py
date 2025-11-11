"""WebSocket connection manager."""

from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        # run_id -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, run_id: str):
        """Accept new WebSocket connection."""
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = []
        self.active_connections[run_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, run_id: str):
        """Remove WebSocket connection."""
        if run_id in self.active_connections:
            self.active_connections[run_id].remove(websocket)
            if not self.active_connections[run_id]:
                del self.active_connections[run_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket."""
        await websocket.send_text(json.dumps(message))
    
    async def broadcast_to_run(self, message: dict, run_id: str):
        """Broadcast message to all connections watching a run."""
        if run_id in self.active_connections:
            for connection in self.active_connections[run_id]:
                await connection.send_text(json.dumps(message))
    
    async def broadcast_test_update(self, run_id: str, test_result: dict):
        """Broadcast test result update."""
        message = {
            "type": "test_result",
            "run_id": run_id,
            "data": test_result
        }
        await self.broadcast_to_run(message, run_id)
    
    async def broadcast_run_status(self, run_id: str, status: str, summary: dict = None):
        """Broadcast run status update."""
        message = {
            "type": "run_status",
            "run_id": run_id,
            "status": status,
            "summary": summary
        }
        await self.broadcast_to_run(message, run_id)
