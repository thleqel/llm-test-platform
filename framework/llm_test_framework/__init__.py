"""LLM Test Framework - Core package."""

from .client import DeepEvalClient
from .adapters import AdapterFactory, BaseTriggerAdapter
from .runner import TestExecutor, ParallelTestRunner
from .storage import YAMLLoader, FileResultStore
from .models import TestCase, TestResult, TestSuite, TestRun, TestStatus

__version__ = "0.1.0"

__all__ = [
    "DeepEvalClient",
    "AdapterFactory",
    "BaseTriggerAdapter",
    "TestExecutor",
    "ParallelTestRunner",
    "YAMLLoader",
    "FileResultStore",
    "TestCase",
    "TestResult",
    "TestSuite",
    "TestRun",
    "TestStatus",
]
