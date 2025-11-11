"""Shell script adapter for CLI tools."""

import asyncio
import json
import jmespath
from typing import Dict, Any

from .base import BaseTriggerAdapter, AdapterResult


class ShellScriptAdapter(BaseTriggerAdapter):
    """Adapter for executing shell scripts and CLI tools."""
    
    async def execute(self, test_case: Dict, context: Dict) -> AdapterResult:
        """Execute shell command and extract output."""
        try:
            command = self.config["command"]
            args = self.config.get("args", [])
            timeout = self.config.get("timeout", 60)
            
            # Substitute variables in args
            substituted_args = []
            variables = {
                "input": test_case["input"],
                "test_case_id": test_case["id"],
                **test_case.get("context", {}),
                **context
            }
            
            for arg in args:
                if isinstance(arg, str):
                    substituted_args.append(self._substitute_variables(arg, variables))
                else:
                    substituted_args.append(str(arg))
            
            # Execute command
            process = await asyncio.create_subprocess_exec(
                command,
                *substituted_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )
            
            # Parse output
            stdout_str = stdout.decode()
            stderr_str = stderr.decode()
            
            # Try to parse as JSON if response_path specified
            response_path = self.config.get("response_path")
            if response_path:
                try:
                    output_data = json.loads(stdout_str)
                    actual_output = jmespath.search(response_path, output_data)
                    if actual_output is None:
                        actual_output = stdout_str
                except json.JSONDecodeError:
                    actual_output = stdout_str
            else:
                actual_output = stdout_str.strip()
            
            return AdapterResult(
                actual_output=actual_output,
                metadata={
                    "command": command,
                    "args": substituted_args,
                    "return_code": process.returncode,
                    "stderr": stderr_str
                },
                success=process.returncode == 0
            )
        
        except asyncio.TimeoutError:
            return AdapterResult(
                actual_output="",
                metadata={"error": "Command timeout"},
                success=False,
                error="Command execution timeout"
            )
        except Exception as e:
            return AdapterResult(
                actual_output="",
                metadata={"error_details": str(e)},
                success=False,
                error=str(e)
            )
