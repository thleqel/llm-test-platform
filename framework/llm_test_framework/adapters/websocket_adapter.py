"""WebSocket adapter for real-time communication."""

import asyncio
import websockets
import json
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class WebSocketAdapter(BaseTriggerAdapter):
    """Adapter for WebSocket communication."""
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Connect to WebSocket and exchange messages."""
        try:
            url = self.config["url"]
            timeout = self.config.get("timeout", 30)
            
            variables = {
                "input": test_case["input"],
                "test_case_id": test_case["id"],
                **test_case.get("context", {}),
                **context
            }
            
            async with websockets.connect(url) as websocket:
                # Send connect message if specified
                if "connect_message" in self.config:
                    connect_msg = self._substitute_dict(
                        self.config["connect_message"],
                        variables
                    )
                    await websocket.send(json.dumps(connect_msg))
                
                # Send actual message
                send_message = self._substitute_dict(
                    self.config["send_message"],
                    variables
                )
                await websocket.send(json.dumps(send_message))
                
                # Wait for response
                wait_config = self.config.get("wait_for_response", {})
                response_timeout = wait_config.get("timeout", timeout)
                
                response = await asyncio.wait_for(
                    websocket.recv(),
                    timeout=response_timeout
                )
                
                # Parse response
                response_data = json.loads(response)
                
                # Extract actual_output
                extract_path = self.config.get("extract_path", "content")
                if "." in extract_path:
                    # Simple dot notation support
                    actual_output = response_data
                    for key in extract_path.split("."):
                        actual_output = actual_output.get(key, "")
                else:
                    actual_output = response_data.get(extract_path, str(response_data))
                
                return AdapterResult(
                    actual_output=str(actual_output),
                    metadata={
                        "url": url,
                        "full_response": response_data
                    },
                    success=True
                )
        
        except asyncio.TimeoutError:
            return AdapterResult(
                actual_output="",
                metadata={"error": "WebSocket timeout"},
                success=False,
                error="WebSocket response timeout"
            )
        except Exception as e:
            return AdapterResult(
                actual_output="",
                metadata={"error_details": str(e)},
                success=False,
                error=str(e)
            )
    
    def _substitute_dict(self, data: Dict, variables: Dict) -> Dict:
        """Recursively substitute variables in dict."""
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = self._substitute_variables(value, variables)
            elif isinstance(value, dict):
                result[key] = self._substitute_dict(value, variables)
            else:
                result[key] = value
        return result
