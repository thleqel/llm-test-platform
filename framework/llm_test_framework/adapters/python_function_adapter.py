"""Python function adapter for direct function calls."""

import importlib
import inspect
import asyncio
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class PythonFunctionAdapter(BaseTriggerAdapter):
    """Adapter for calling Python functions directly."""
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Call Python function and return output."""
        try:
            # Import module and function
            module_name = self.config["module"]
            function_name = self.config["function"]
            
            module = importlib.import_module(module_name)
            function = getattr(module, function_name)
            
            # Prepare arguments
            args_template = self.config.get("args", {})
            args = {}
            for key, value in args_template.items():
                if isinstance(value, str):
                    args[key] = self._substitute_variables(value, {
                        "input": test_case["input"],
                        "test_case_id": test_case["id"],
                        **test_case.get("context", {}),
                        **context
                    })
                else:
                    args[key] = value
            
            # Call function (async or sync)
            if inspect.iscoroutinefunction(function):
                result = await function(**args)
            else:
                result = function(**args)
            
            # Convert result to string if needed
            actual_output = str(result) if not isinstance(result, str) else result
            
            return AdapterResult(
                actual_output=actual_output,
                metadata={
                    "module": module_name,
                    "function": function_name,
                    "args": args
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
