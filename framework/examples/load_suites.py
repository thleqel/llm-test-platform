"""Example: Load and inspect test suites."""

from pathlib import Path
from llm_test_framework import YAMLLoader


def main():
    """Load and display test suite information."""
    
    # Directory with test suites
    suites_dir = Path(__file__).parent.parent / "test_artifacts" / "test_suites"
    
    # Load all suites
    suites = YAMLLoader.load_suites_from_directory(suites_dir)
    
    print(f"Found {len(suites)} test suites:\n")
    
    for suite in suites:
        print(f"📋 {suite.name} (v{suite.version})")
        print(f"   Description: {suite.metadata.get('description', 'N/A')}")
        print(f"   Test Cases: {len(suite.test_cases)}")
        
        if suite.default_adapter:
            print(f"   Default Adapter: {suite.default_adapter.get('type')}")
        
        print(f"   Tags: {', '.join(suite.metadata.get('tags', []))}")
        
        # List test cases
        for tc in suite.test_cases:
            status = "✅" if tc.enabled else "⏭️"
            adapter_type = tc.adapter.get("type") if tc.adapter else "default"
            print(f"      {status} {tc.id}: {tc.name} [{adapter_type}]")
        
        print()


if __name__ == "__main__":
    main()
