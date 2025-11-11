"""DeepEval service client."""

import httpx
from typing import List, Dict, Any, Optional
import asyncio


class DeepEvalClient:
    """Async HTTP client for DeepEval service."""
    
    def __init__(self, base_url: str = "http://localhost:8001", timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    async def evaluate_single(
        self,
        input: str,
        actual_output: str,
        metrics: List[str],
        expected_output: Optional[str] = None,
        retrieval_context: Optional[List[str]] = None,
        metric_kwargs: Optional[Dict[str, Any]] = None,
        model_configuration: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate a single test case."""
        if not self.client:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        
        payload = {
            "input": input,
            "actual_output": actual_output,
            "metrics": metrics
        }
        
        if expected_output:
            payload["expected_output"] = expected_output
        if retrieval_context:
            payload["retrieval_context"] = retrieval_context
        if metric_kwargs:
            payload["metric_kwargs"] = metric_kwargs
        if model_configuration:
            payload["model_configuration"] = model_configuration
        
        response = await self.client.post(
            f"{self.base_url}/api/v1/evaluation/single",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    async def evaluate_batch(
        self,
        test_cases: List[Dict[str, Any]],
        metrics: List[str],
        model_configuration: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate multiple test cases."""
        if not self.client:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        
        payload = {
            "test_cases": test_cases,
            "metrics": metrics
        }
        
        if model_configuration:
            payload["model_configuration"] = model_configuration
        
        response = await self.client.post(
            f"{self.base_url}/api/v1/evaluation/batch",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get available metrics."""
        if not self.client:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        
        response = await self.client.get(f"{self.base_url}/api/v1/evaluation/metrics")
        response.raise_for_status()
        return response.json()
    
    async def get_providers(self) -> Dict[str, Any]:
        """Get available model providers."""
        if not self.client:
            self.client = httpx.AsyncClient(timeout=self.timeout)
        
        response = await self.client.get(f"{self.base_url}/api/v1/evaluation/providers")
        response.raise_for_status()
        return response.json()
    
    async def health_check(self) -> bool:
        """Check if service is healthy."""
        try:
            if not self.client:
                self.client = httpx.AsyncClient(timeout=self.timeout)
            
            response = await self.client.get(f"{self.base_url}/health")
            return response.status_code == 200
        except:
            return False
