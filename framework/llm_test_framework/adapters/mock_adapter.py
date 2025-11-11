"""Mock adapter for unit testing."""

from pathlib import Path
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class MockAdapter(BaseTriggerAdapter):
    """Adapter for mock/fixture responses."""
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Return mock actual_output."""
        try:
            # Check for direct actual_output
            if "actual_output" in self.config:
                actual_output = self.config["actual_output"]
            
            # Or load from fixture file
            elif "fixture_file" in self.config:
                fixture_path = Path(self.config["fixture_file"])
                if not fixture_path.exists():
                    raise FileNotFoundError(f"Fixture file not found: {fixture_path}")
                
                actual_output = fixture_path.read_text()
            
            else:
                raise ValueError("Mock adapter requires 'actual_output' or 'fixture_file' in config")
            
            return AdapterResult(
                actual_output=actual_output,
                metadata={
                    "adapter_type": "mock",
                    "fixture_file": self.config.get("fixture_file")
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
