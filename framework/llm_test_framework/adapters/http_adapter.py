"""HTTP API adapter for REST API testing."""

import httpx
import jmespath
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class HTTPAPIAdapter(BaseTriggerAdapter):
    """Adapter for HTTP/REST API calls."""
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Execute HTTP request and extract actual_output."""
        try:
            url = self.config.get("endpoint")
            method = self.config.get("method", "POST").upper()
            headers = self.config.get("headers", {})
            timeout = self.config.get("timeout", 30)
            
            # Substitute variables in headers
            substituted_headers = self._substitute_dict(headers, {
                "input": test_case["input"],
                "test_case_id": test_case["id"],
                **test_case.get("context", {}),
                **context
            })
            
            # Substitute variables in request body
            request_body = self.config.get("request_body", {})
            substituted_body = self._substitute_dict(request_body, {
                "input": test_case["input"],
                "test_case_id": test_case["id"],
                **test_case.get("context", {}),
                **context
            })
            
            # Make HTTP request
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=substituted_body,
                    headers=substituted_headers,
                    timeout=timeout
                )
                response.raise_for_status()
                
                # Extract actual_output using JSONPath
                response_data = response.json()
                response_path = self.config.get("response_path", "response")
                actual_output = jmespath.search(response_path, response_data)
                
                if actual_output is None:
                    raise ValueError(f"Could not extract output from path: {response_path}")
                
                return AdapterResult(
                    actual_output=str(actual_output),
                    metadata={
                        "status_code": response.status_code,
                        "response_time_ms": response.elapsed.total_seconds() * 1000,
                        "full_response": response_data,
                        "request_body": substituted_body
                    },
                    success=True
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
            elif isinstance(value, list):
                result[key] = [
                    self._substitute_variables(v, variables) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                result[key] = value
        return result
