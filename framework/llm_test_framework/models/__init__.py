"""Data models for test framework."""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum


class TestStatus(str, Enum):
    """Test execution status."""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    SKIPPED = "skipped"


@dataclass
class TestCase:
    """Test case definition."""
    id: str
    name: str
    input: str
    expected_output: Optional[str] = None
    retrieval_context: Optional[List[str]] = None
    metrics: List[str] = field(default_factory=list)
    adapter: Optional[Dict[str, Any]] = None
    context: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    enabled: bool = True
    skip_reason: Optional[str] = None
    thresholds: Dict[str, float] = field(default_factory=dict)


@dataclass
class MetricResult:
    """Individual metric evaluation result."""
    name: str
    score: float
    threshold: float
    passed: bool
    reason: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestResult:
    """Test execution result."""
    test_case_id: str
    run_id: str
    status: TestStatus
    actual_output: Optional[str] = None
    expected_output: Optional[str] = None
    metrics: List[MetricResult] = field(default_factory=list)
    passed: bool = False
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    duration_ms: Optional[float] = None


@dataclass
class TestSuite:
    """Collection of test cases."""
    name: str
    version: str
    metadata: Dict[str, Any]
    default_adapter: Optional[Dict[str, Any]]
    test_config: Dict[str, Any]
    test_cases: List[TestCase]


@dataclass
class TestRun:
    """Test run metadata."""
    id: str
    suite_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    errors: int = 0
    skipped: int = 0
    status: str = "running"
    metadata: Dict[str, Any] = field(default_factory=dict)
