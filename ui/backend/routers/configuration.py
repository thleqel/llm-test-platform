"""Configuration router - manage settings."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import json
from pathlib import Path

router = APIRouter()

CONFIG_FILE = Path("../config/ui_config.json")


class ConfigUpdate(BaseModel):
    """Configuration update request."""
    key: str
    value: Any


@router.get("/")
async def get_config():
    """Get current configuration."""
    try:
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                config = json.load(f)
        else:
            config = _get_default_config()
        
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{key}")
async def get_config_value(key: str):
    """Get specific configuration value."""
    try:
        config = await get_config()
        
        # Support nested keys with dot notation
        keys = key.split(".")
        value = config
        for k in keys:
            if k not in value:
                raise HTTPException(status_code=404, detail=f"Config key '{key}' not found")
            value = value[k]
        
        return {"key": key, "value": value}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/")
async def update_config(update: ConfigUpdate):
    """Update configuration value."""
    try:
        # Load current config
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                config = json.load(f)
        else:
            config = _get_default_config()
        
        # Update value (support nested keys)
        keys = update.key.split(".")
        current = config
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        
        current[keys[-1]] = update.value
        
        # Save config
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        
        return {"message": "Configuration updated", "key": update.key, "value": update.value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_config():
    """Reset configuration to defaults."""
    try:
        config = _get_default_config()
        
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        
        return {"message": "Configuration reset to defaults", "config": config}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _get_default_config() -> Dict[str, Any]:
    """Get default configuration."""
    return {
        "deepeval": {
            "url": "http://localhost:8001",
            "timeout": 30,
            "retry_attempts": 3
        },
        "execution": {
            "max_concurrency": 10,
            "default_adapter": None
        },
        "storage": {
            "results_dir": "../test_results",
            "artifacts_dir": "../test_artifacts"
        },
        "ui": {
            "refresh_interval": 5000,
            "show_screenshots": True,
            "theme": "light"
        },
        "notifications": {
            "enabled": False,
            "on_failure": True,
            "on_completion": False
        }
    }
