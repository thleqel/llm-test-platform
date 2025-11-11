"""Test artifacts router - manage test cases and suites."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path
from typing import List, Optional
import yaml
import json

from llm_test_framework import YAMLLoader
import os

router = APIRouter()

# Base paths - ui/backend/routers -> ui/backend -> ui -> project_root
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ARTIFACTS_DIR = Path(os.getenv("TEST_ARTIFACTS_DIR", str(PROJECT_ROOT / "test_artifacts")))
TEST_SUITES_DIR = ARTIFACTS_DIR / "test_suites"

print(f"📁 Test artifacts directory: {ARTIFACTS_DIR}")
print(f"📁 Test suites directory: {TEST_SUITES_DIR}")


@router.get("/suites")
async def list_suites():
    """List all test suites."""
    try:
        suites = YAMLLoader.load_suites_from_directory(str(TEST_SUITES_DIR))
        
        return {
            "suites": [
                {
                    "name": suite.name,
                    "version": suite.version,
                    "test_count": len(suite.test_cases),
                    "default_adapter": suite.default_adapter,
                    "metadata": suite.metadata
                }
                for suite in suites
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suites/{suite_name}")
async def get_suite(suite_name: str):
    """Get specific test suite by name."""
    try:
        # Find suite file
        suite_files = list(TEST_SUITES_DIR.glob("*.yml")) + list(TEST_SUITES_DIR.glob("*.yaml"))
        
        for suite_file in suite_files:
            suite = YAMLLoader.load_suite(str(suite_file))
            if suite.name == suite_name:
                return {
                    "name": suite.name,
                    "version": suite.version,
                    "default_adapter": suite.default_adapter,
                    "metadata": suite.metadata,
                    "test_cases": [
                        {
                            "id": tc.id,
                            "name": tc.name,
                            "input": tc.input,
                            "expected_output": tc.expected_output,
                            "context": tc.context,
                            "adapter": tc.adapter,
                            "metrics": tc.metrics,
                            "tags": tc.tags
                        }
                        for tc in suite.test_cases
                    ]
                }
        
        raise HTTPException(status_code=404, detail=f"Suite '{suite_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-cases")
async def list_test_cases(suite_name: Optional[str] = None, tags: Optional[str] = None):
    """List all test cases, optionally filtered by suite or tags."""
    try:
        suites = YAMLLoader.load_suites_from_directory(str(TEST_SUITES_DIR))
        
        test_cases = []
        for suite in suites:
            if suite_name and suite.name != suite_name:
                continue
            
            for tc in suite.test_cases:
                # Filter by tags if specified
                if tags:
                    tag_list = [t.strip() for t in tags.split(",")]
                    if not any(tag in tc.tags for tag in tag_list):
                        continue
                
                test_cases.append({
                    "id": tc.id,
                    "name": tc.name,
                    "suite": suite.name,
                    "input": tc.input,
                    "expected_output": tc.expected_output,
                    "adapter": tc.adapter or suite.default_adapter,
                    "metrics": tc.metrics,
                    "thresholds": tc.thresholds,
                    "tags": tc.tags
                })
        
        return {"test_cases": test_cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-cases/{test_case_id}")
async def get_test_case(test_case_id: str):
    """Get specific test case by ID."""
    try:
        suites = YAMLLoader.load_suites_from_directory(str(TEST_SUITES_DIR))
        
        for suite in suites:
            for tc in suite.test_cases:
                if tc.id == test_case_id:
                    return {
                        "id": tc.id,
                        "name": tc.name,
                        "suite": suite.name,
                        "input": tc.input,
                        "expected_output": tc.expected_output,
                        "context": tc.context,
                        "adapter": tc.adapter or suite.default_adapter,
                        "metrics": tc.metrics,
                        "thresholds": tc.thresholds,
                        "tags": tc.tags
                    }
        
        raise HTTPException(status_code=404, detail=f"Test case '{test_case_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/test-cases/{test_case_id}")
async def update_test_case(test_case_id: str, update_data: dict):
    """Update a test case in its suite file."""
    try:
        # Find the test case and its suite file
        suite_files = list(TEST_SUITES_DIR.glob("*.yml")) + list(TEST_SUITES_DIR.glob("*.yaml"))
        
        for suite_file in suite_files:
            with open(suite_file, 'r') as f:
                suite_data = yaml.safe_load(f)
            
            # Find the test case in this suite
            test_cases = suite_data.get('test_cases', [])
            test_case_index = None
            
            for idx, tc in enumerate(test_cases):
                if tc.get('id') == test_case_id:
                    test_case_index = idx
                    break
            
            if test_case_index is not None:
                # Update the test case
                current_tc = test_cases[test_case_index]
                
                # Update allowed fields
                if 'name' in update_data:
                    current_tc['name'] = update_data['name']
                if 'input' in update_data:
                    current_tc['input'] = update_data['input']
                if 'expected_output' in update_data:
                    current_tc['expected_output'] = update_data['expected_output']
                if 'context' in update_data:
                    current_tc['context'] = update_data['context']
                if 'metrics' in update_data:
                    current_tc['metrics'] = update_data['metrics']
                if 'thresholds' in update_data:
                    current_tc['thresholds'] = update_data['thresholds']
                if 'tags' in update_data:
                    current_tc['tags'] = update_data['tags']
                if 'adapter' in update_data:
                    current_tc['adapter'] = update_data['adapter']
                
                # Write back to file
                with open(suite_file, 'w') as f:
                    yaml.dump(suite_data, f, default_flow_style=False, sort_keys=False)
                
                # Return updated test case
                suite = YAMLLoader.load_suite(str(suite_file))
                for tc in suite.test_cases:
                    if tc.id == test_case_id:
                        return {
                            "message": "Test case updated successfully",
                            "test_case": {
                                "id": tc.id,
                                "name": tc.name,
                                "suite": suite.name,
                                "input": tc.input,
                                "expected_output": tc.expected_output,
                                "context": tc.context,
                                "adapter": tc.adapter or suite.default_adapter,
                                "metrics": tc.metrics,
                                "thresholds": tc.thresholds,
                                "tags": tc.tags
                            }
                        }
        
        raise HTTPException(status_code=404, detail=f"Test case '{test_case_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-cases")
async def create_test_case(test_case_data: dict):
    """Create a new test case in a suite."""
    try:
        suite_name = test_case_data.get('suite')
        if not suite_name:
            raise HTTPException(status_code=400, detail="Suite name is required")
        
        # Find the suite file
        suite_files = list(TEST_SUITES_DIR.glob("*.yml")) + list(TEST_SUITES_DIR.glob("*.yaml"))
        target_file = None
        
        for suite_file in suite_files:
            with open(suite_file, 'r') as f:
                suite_data = yaml.safe_load(f)
            
            if suite_data.get('metadata', {}).get('name') == suite_name:
                target_file = suite_file
                break
        
        if not target_file:
            raise HTTPException(status_code=404, detail=f"Suite '{suite_name}' not found")
        
        # Load current suite data
        with open(target_file, 'r') as f:
            suite_data = yaml.safe_load(f)
        
        # Generate test case ID if not provided
        test_case_id = test_case_data.get('id')
        if not test_case_id:
            # Generate ID based on existing IDs
            existing_ids = [tc.get('id', '') for tc in suite_data.get('test_cases', [])]
            # Extract numeric part from IDs like "mock_001", "test_001"
            max_num = 0
            for existing_id in existing_ids:
                parts = existing_id.split('_')
                if len(parts) > 1 and parts[-1].isdigit():
                    max_num = max(max_num, int(parts[-1]))
            
            # Generate new ID
            prefix = suite_name.lower().replace(' ', '_')[:10]
            test_case_id = f"{prefix}_{str(max_num + 1).zfill(3)}"
        
        # Create new test case
        new_test_case = {
            'id': test_case_id,
            'name': test_case_data.get('name', 'New Test Case'),
            'input': test_case_data.get('input', ''),
            'expected_output': test_case_data.get('expected_output', ''),
            'metrics': test_case_data.get('metrics', ['answer_relevancy']),
            'tags': test_case_data.get('tags', []),
            'enabled': test_case_data.get('enabled', True)
        }
        
        # Add optional fields
        if 'context' in test_case_data:
            new_test_case['context'] = test_case_data['context']
        
        if 'adapter' in test_case_data:
            new_test_case['adapter'] = test_case_data['adapter']
        
        if 'thresholds' in test_case_data:
            new_test_case['thresholds'] = test_case_data['thresholds']
        
        # Add to suite
        if 'test_cases' not in suite_data:
            suite_data['test_cases'] = []
        
        suite_data['test_cases'].append(new_test_case)
        
        # Write back to file
        with open(target_file, 'w') as f:
            yaml.dump(suite_data, f, default_flow_style=False, sort_keys=False)
        
        return {
            "message": "Test case created successfully",
            "test_case": {
                "id": new_test_case['id'],
                "name": new_test_case['name'],
                "suite": suite_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suites")
async def create_suite(suite_data: dict):
    """Create a new test suite."""
    try:
        name = suite_data.get('name')
        if not name:
            raise HTTPException(status_code=400, detail="Suite name is required")
        
        # Generate filename from suite name
        filename = name.lower().replace(' ', '_').replace('-', '_')
        filename = ''.join(c for c in filename if c.isalnum() or c == '_')
        file_path = TEST_SUITES_DIR / f"{filename}.yml"
        
        # Check if file already exists
        if file_path.exists():
            raise HTTPException(status_code=400, detail=f"Suite with name '{name}' already exists")
        
        # Create suite structure
        new_suite = {
            'version': suite_data.get('version', '1.0'),
            'metadata': {
                'name': name,
                'description': suite_data.get('description', ''),
                'owner': suite_data.get('owner', 'dev-team'),
                'tags': suite_data.get('tags', [])
            },
            'test_cases': []
        }
        
        # Add default adapter if provided
        if 'default_adapter' in suite_data:
            new_suite['default_adapter'] = suite_data['default_adapter']
        
        # Write to file
        with open(file_path, 'w') as f:
            yaml.dump(new_suite, f, default_flow_style=False, sort_keys=False)
        
        return {
            "message": "Suite created successfully",
            "suite": {
                "name": name,
                "version": new_suite['version'],
                "filename": file_path.name,
                "test_count": 0
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suites/upload")
async def upload_suite(file: UploadFile = File(...)):
    """Upload new test suite YAML file."""
    try:
        if not file.filename.endswith(('.yml', '.yaml')):
            raise HTTPException(status_code=400, detail="File must be YAML format (.yml or .yaml)")
        
        # Read and validate
        content = await file.read()
        suite_data = yaml.safe_load(content)
        
        # Save to test_suites directory
        file_path = TEST_SUITES_DIR / file.filename
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Load and return suite info
        suite = YAMLLoader.load_suite(str(file_path))
        
        return {
            "message": "Suite uploaded successfully",
            "suite": {
                "name": suite.name,
                "version": suite.version,
                "test_count": len(suite.test_cases)
            }
        }
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/adapters")
async def list_adapters():
    """List available trigger adapter types."""
    from llm_test_framework import AdapterFactory
    
    adapters = AdapterFactory.list_adapters()
    
    return {
        "adapters": [
            {
                "type": adapter,
                "description": _get_adapter_description(adapter)
            }
            for adapter in adapters
        ]
    }


def _get_adapter_description(adapter_type: str) -> str:
    """Get description for adapter type."""
    descriptions = {
        "http": "HTTP/REST API calls with JSONPath extraction",
        "playwright": "Browser automation for UI testing",
        "python_function": "Direct Python function calls",
        "langchain": "LangChain chain integration",
        "mock": "Mock/fixture responses for testing",
        "shell": "Shell script and CLI tool execution",
        "websocket": "WebSocket real-time communication"
    }
    return descriptions.get(adapter_type, "Custom adapter")
