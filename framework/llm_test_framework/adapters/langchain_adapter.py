"""LangChain adapter for chain integration."""

import importlib
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class LangChainAdapter(BaseTriggerAdapter):
    """Adapter for LangChain chains."""
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Execute LangChain chain."""
        try:
            # Import chain
            chain_module = self.config["chain_module"]
            chain_name = self.config["chain_name"]
            
            module = importlib.import_module(chain_module)
            chain = getattr(module, chain_name)
            
            # Prepare input
            input_key = self.config.get("input_key", "input")
            output_key = self.config.get("output_key", "output")
            
            chain_input = {
                input_key: test_case["input"],
                **test_case.get("context", {}),
                **self.config.get("chain_kwargs", {})
            }
            
            # Invoke chain
            result = await chain.ainvoke(chain_input)
            
            # Extract output
            if isinstance(result, dict):
                actual_output = result.get(output_key, str(result))
            else:
                actual_output = str(result)
            
            return AdapterResult(
                actual_output=actual_output,
                metadata={
                    "chain": chain_name,
                    "full_result": result if isinstance(result, dict) else {}
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
