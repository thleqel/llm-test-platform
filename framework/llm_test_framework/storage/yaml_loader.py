"""YAML test case loader."""

import yaml
from pathlib import Path
from typing import Dict, Any, List

from ..models import TestCase, TestSuite


class YAMLLoader:
    """Load test suites from YAML files."""
    
    @staticmethod
    def load_suite(file_path: str | Path) -> TestSuite:
        """Load test suite from YAML file."""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Test suite file not found: {file_path}")
        
        with open(file_path) as f:
            data = yaml.safe_load(f)
        
        # Parse test cases
        test_cases = []
        for tc_data in data.get("test_cases", []):
            test_case = TestCase(
                id=tc_data["id"],
                name=tc_data.get("name", tc_data["id"]),
                input=tc_data["input"],
                expected_output=tc_data.get("expected_output"),
                retrieval_context=tc_data.get("retrieval_context"),
                metrics=tc_data.get("metrics", []),
                adapter=tc_data.get("adapter"),
                context=tc_data.get("context", {}),
                tags=tc_data.get("tags", []),
                enabled=tc_data.get("enabled", True),
                skip_reason=tc_data.get("skip_reason"),
                thresholds=tc_data.get("thresholds", {})
            )
            test_cases.append(test_case)
        
        # Create test suite
        suite = TestSuite(
            name=data.get("metadata", {}).get("name", file_path.stem),
            version=data.get("version", "1.0"),
            metadata=data.get("metadata", {}),
            default_adapter=data.get("default_adapter") or data.get("llm_adapter"),
            test_config=data.get("test_config", {}),
            test_cases=test_cases
        )
        
        return suite
    
    @staticmethod
    def load_suites_from_directory(directory: str | Path) -> List[TestSuite]:
        """Load all test suites from a directory."""
        directory = Path(directory)
        
        if not directory.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")
        
        suites = []
        for yaml_file in directory.glob("*.yml"):
            try:
                suite = YAMLLoader.load_suite(yaml_file)
                suites.append(suite)
            except Exception as e:
                print(f"Error loading {yaml_file}: {e}")
        
        for yaml_file in directory.glob("*.yaml"):
            try:
                suite = YAMLLoader.load_suite(yaml_file)
                suites.append(suite)
            except Exception as e:
                print(f"Error loading {yaml_file}: {e}")
        
        return suites
