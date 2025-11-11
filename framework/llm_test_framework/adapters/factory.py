"""Adapter factory for creating adapters."""

from typing import Dict, Any
from .base import BaseTriggerAdapter
from .http_adapter import HTTPAPIAdapter
from .playwright_adapter import PlaywrightAdapter
from .python_function_adapter import PythonFunctionAdapter
from .langchain_adapter import LangChainAdapter
from .mock_adapter import MockAdapter
from .shell_adapter import ShellScriptAdapter
from .websocket_adapter import WebSocketAdapter


class AdapterFactory:
    """Factory for creating adapter instances."""
    
    _adapters = {
        "http": HTTPAPIAdapter,
        "playwright": PlaywrightAdapter,
        "python_function": PythonFunctionAdapter,
        "langchain": LangChainAdapter,
        "mock": MockAdapter,
        "shell": ShellScriptAdapter,
        "websocket": WebSocketAdapter,
    }
    
    @classmethod
    def create(cls, adapter_config: Dict[str, Any]) -> BaseTriggerAdapter:
        """Create adapter instance from configuration.
        
        Args:
            adapter_config: Dictionary with 'type' and 'config' keys
            
        Returns:
            Initialized adapter instance
            
        Raises:
            ValueError: If adapter type is unknown
        """
        adapter_type = adapter_config.get("type")
        if not adapter_type:
            raise ValueError("Adapter config must include 'type'")
        
        adapter_class = cls._adapters.get(adapter_type)
        if not adapter_class:
            raise ValueError(
                f"Unknown adapter type: {adapter_type}. "
                f"Available types: {', '.join(cls._adapters.keys())}"
            )
        
        config = adapter_config.get("config", {})
        return adapter_class(config)
    
    @classmethod
    def register(cls, name: str, adapter_class: type):
        """Register a custom adapter type.
        
        Args:
            name: Adapter type name
            adapter_class: Adapter class (must extend BaseTriggerAdapter)
        """
        if not issubclass(adapter_class, BaseTriggerAdapter):
            raise ValueError(
                f"Adapter class must extend BaseTriggerAdapter, got {adapter_class}"
            )
        cls._adapters[name] = adapter_class
    
    @classmethod
    def list_adapters(cls) -> list[str]:
        """List all registered trigger adapter types."""
        return list(cls._adapters.keys())
