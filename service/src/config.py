from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field
from typing import Optional


class Settings(BaseSettings):
    # Ollama Configuration
    ollama_host: str = Field(default="http://localhost:11434", alias="OLLAMA_HOST")
    ollama_model: str = Field(default="llama3.1:8b", alias="OLLAMA_MODEL")
    ollama_temperature: float = Field(default=0.0, alias="OLLAMA_TEMPERATURE")
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-3.5-turbo", alias="OPENAI_MODEL")
    openai_temperature: float = Field(default=0.0, alias="OPENAI_TEMPERATURE")
    
    # Azure OpenAI Configuration
    azure_openai_api_key: Optional[str] = Field(default=None, alias="AZURE_OPENAI_API_KEY")
    azure_openai_endpoint: Optional[str] = Field(default=None, alias="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_version: str = Field(default="2023-12-01-preview", alias="AZURE_OPENAI_API_VERSION")
    azure_openai_deployment: Optional[str] = Field(default=None, alias="AZURE_OPENAI_DEPLOYMENT")
    
    # Service Configuration
    service_host: str = Field(default="0.0.0.0", alias="SERVICE_HOST")
    service_port: int = Field(default=8000, alias="SERVICE_PORT")
    debug: bool = Field(default=False, alias="DEBUG")
    
    # API Configuration
    api_title: str = Field(default="DeepEval Service", alias="API_TITLE")
    api_version: str = Field(default="1.0.0", alias="API_VERSION")
    
    # Model timeout configuration
    default_model_timeout: int = Field(default=180, alias="DEFAULT_MODEL_TIMEOUT")
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()