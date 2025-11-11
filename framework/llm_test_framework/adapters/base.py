"""Base adapter interfaces."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, Optional
import re


@dataclass
class AdapterResult:
    """Result from adapter execution."""
    actual_output: str
    metadata: Dict[str, Any]
    success: bool
    error: Optional[str] = None


class BaseTriggerAdapter(ABC):
    """Base class for all trigger adapters."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize adapter with configuration."""
        self.config = config
    
    @abstractmethod
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Execute adapter and return actual_output.
        
        Args:
            test_case: Test case data including input, id, etc.
            context: Additional context data
            
        Returns:
            AdapterResult with actual_output, metadata, and success status
        """
        pass
    
    async def setup(self):
        """Optional setup before execution."""
        pass
    
    async def teardown(self):
        """Optional cleanup after execution."""
        pass
    
    def _substitute_variables(self, template: str, variables: Dict[str, Any]) -> str:
        """Substitute {{variable}} patterns in template string."""
        result = template
        for key, value in variables.items():
            pattern = f"{{{{{key}}}}}"
            result = result.replace(pattern, str(value))
        return result
