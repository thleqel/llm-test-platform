# DeepEval Service

A containerized REST API service that wraps [DeepEval](https://deepeval.com/) with [Ollama](https://ollama.ai/) integration for evaluating LLM outputs. This service provides easy-to-use HTTP endpoints for running various evaluation metrics on your AI model outputs.

## 🚀 Features

- **Multiple Model Providers**: Support for Ollama (local), OpenAI, and Azure OpenAI models
- **Dynamic Model Selection**: Choose different models per evaluation request
- **Multiple Evaluation Metrics**: Support for 10+ DeepEval metrics including Answer Relevancy, Faithfulness, Hallucination Detection, Bias Detection, and more
- **Custom Thresholds**: Configure metric thresholds for pass/fail evaluation
- **RESTful API**: Simple HTTP endpoints for single and batch evaluations
- **Containerized**: Docker and Docker Compose for easy deployment
- **Comprehensive Documentation**: Auto-generated API docs with Swagger UI
- **Flexible Configuration**: Environment-based configuration for different setups

## 📋 Prerequisites

- Docker and Docker Compose
- At least 4GB RAM (for running Ollama models)
- Internet connection (for initial model download)

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd deepeval-service

# Copy environment configuration
cp .env.example .env

# Run the automated setup script
./setup.sh
```

The setup script will:
- Start Ollama and DeepEval services via Docker Compose
- Download the default model (`llama3.1:8b`)
- Verify everything is working

### 2. Manual Setup (Alternative)

```bash
# Start services
docker-compose up -d

# Wait for Ollama to start, then pull a model
docker exec ollama ollama pull llama3.1:8b

# Verify services are running
curl http://localhost:8000/health
curl http://localhost:11434/api/version
```

## 📚 API Documentation

Once running, visit:
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 🔧 API Endpoints

### Get Available Metrics
```bash
GET /api/v1/evaluation/metrics
```

### Single Evaluation
```bash
POST /api/v1/evaluation/single
```

**Request Body:**
```json
{
  "input": "What is the capital of France?",
  "actual_output": "Paris is the capital of France.",
  "expected_output": "Paris", // optional
  "retrieval_context": ["France is a country in Europe..."], // optional
  "metrics": ["answer_relevancy", "faithfulness"],
  "metric_kwargs": {} // optional
}
```

### Batch Evaluation
```bash
POST /api/v1/evaluation/batch
```

**Request Body:**
```json
{
  "test_cases": [
    {
      "input": "What is the capital of France?",
      "actual_output": "Paris is the capital of France."
    },
    {
      "input": "What is 2+2?",
      "actual_output": "2+2 equals 4."
    }
  ],
  "metrics": ["answer_relevancy"]
}
```

## 🎯 Available Metrics

| Metric | Description | Requires Context |
|--------|-------------|------------------|
| `answer_relevancy` | Measures how relevant the answer is to the input | No |
| `faithfulness` | Measures factual consistency against context | Yes |
| `contextual_relevancy` | Measures context relevance to input | Yes |
| `contextual_precision` | Measures precision of retrieved context | Yes |
| `contextual_recall` | Measures recall of retrieved context | Yes |
| `hallucination` | Detects hallucinated information | Yes |
| `bias` | Detects bias in the answer | No |
| `toxicity` | Detects toxic content | No |
| `summarization` | Evaluates summarization quality | Yes |

## 🤖 Model Configuration

The service supports multiple model providers. You can specify which model to use in your evaluation requests.

### Supported Providers

**Check available providers:**
```bash
curl http://localhost:8001/api/v1/evaluation/providers
```

### 1. Ollama (Default)
Local models, no API key required:
```json
{
  "model_configuration": {
    "provider": "ollama",
    "model_name": "llama3.1:8b",
    "temperature": 0.0,
    "timeout": 180
  }
}
```

### 2. OpenAI
Requires API key:
```json
{
  "model_configuration": {
    "provider": "openai",
    "model_name": "gpt-3.5-turbo",
    "api_key": "your-openai-api-key",
    "temperature": 0.0
  }
}
```

### 3. Azure OpenAI
Requires API key and endpoint:
```json
{
  "model_configuration": {
    "provider": "azure",
    "model_name": "gpt-35-turbo",
    "api_key": "your-azure-api-key",
    "base_url": "https://your-resource.openai.azure.com",
    "temperature": 0.0
  }
}
```

### Custom Thresholds
Set pass/fail thresholds for metrics:
```json
{
  "input": "What is AI?",
  "actual_output": "AI is artificial intelligence.",
  "metrics": ["answer_relevancy"],
  "metric_kwargs": {
    "threshold": 0.7
  }
}
```
| `conversation_relevancy` | Measures conversational relevance | No |

## 📝 Usage Examples

### Basic Single Evaluation
```bash
curl -X POST "http://localhost:8001/api/v1/evaluation/single" \
     -H "Content-Type: application/json" \
     -d '{
       "input": "What is machine learning?",
       "actual_output": "Machine learning is a subset of AI that enables computers to learn without explicit programming.",
       "metrics": ["answer_relevancy"]
     }'
```

### Evaluation with Model Configuration
```bash
curl -X POST "http://localhost:8001/api/v1/evaluation/single" \
     -H "Content-Type: application/json" \
     -d '{
       "input": "Explain quantum computing",
       "actual_output": "Quantum computing uses quantum mechanics principles...",
       "metrics": ["answer_relevancy", "bias"],
       "model_configuration": {
         "provider": "ollama",
         "model_name": "llama3.1:8b",
         "temperature": 0.1
       }
     }'
```

### Evaluation with Custom Threshold
```bash
curl -X POST "http://localhost:8001/api/v1/evaluation/single" \
     -H "Content-Type: application/json" \
     -d '{
       "input": "What is AI?",
       "actual_output": "AI is artificial intelligence.",
       "metrics": ["answer_relevancy"],
       "metric_kwargs": {"threshold": 0.8}
     }'
```

### Python Client Example

```python
import requests
import json

# Single evaluation with custom model
response = requests.post(
    "http://localhost:8001/api/v1/evaluation/single",
    headers={"Content-Type": "application/json"},
    json={
        "input": "Explain quantum computing",
        "actual_output": "Quantum computing uses quantum mechanics principles...",
        "expected_output": "Quantum computing leverages quantum mechanical phenomena...",
        "metrics": ["answer_relevancy", "correctness"],
        "model_configuration": {
            "provider": "ollama",
            "model_name": "llama3.1:8b",
            "temperature": 0.0
        }
    }
)

result = response.json()
print(f"Answer Relevancy: {result['result']['metrics']['answer_relevancy']['score']}")
print(f"Model Used: {result['result']['model_used']}")
```

### Batch Evaluation Example
```python
# Batch evaluation
batch_response = requests.post(
    "http://localhost:8001/api/v1/evaluation/batch",
    headers={"Content-Type": "application/json"},
    json={
        "test_cases": [
            {
                "input": "What is 2+2?",
                "actual_output": "4",
                "expected_output": "4"
            },
            {
                "input": "What is the capital of France?",
                "actual_output": "Paris",
                "expected_output": "Paris"
            }
        ],
        "metrics": ["answer_relevancy", "correctness"]
    }
)

batch_result = batch_response.json()
for i, result in enumerate(batch_result['results']):
    print(f"Test Case {i+1}: {result['metrics']['answer_relevancy']['score']}")
```

# Get available metrics
curl "http://localhost:8000/api/v1/evaluation/metrics"
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

async function evaluateAnswer() {
  try {
    const response = await axios.post('http://localhost:8000/api/v1/evaluation/single', {
      input: "What are the benefits of renewable energy?",
      actual_output: "Renewable energy reduces carbon emissions and is sustainable for the environment.",
      metrics: ["answer_relevancy", "bias"]
    });
    
    console.log('Evaluation Results:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

evaluateAnswer();
```

## 🧪 Testing

### Run the Test Suite
```bash
# Run all tests
pytest tests/ -v

# Run only unit tests (don't require running service)
pytest tests/ -m unit -v

# Run only integration tests (requires running service)
pytest tests/ -m integration -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html --cov-report=term-missing

# Run specific test file
pytest tests/test_models.py -v

# Run specific test
pytest tests/test_models.py::TestModelValidation::test_model_config_creation -v
```

### Manual API Testing
```bash
# Check service health
curl http://localhost:8001/health

# List available metrics
curl http://localhost:8001/api/v1/evaluation/metrics

# Test simple evaluation
curl -X POST http://localhost:8001/api/v1/evaluation/single \
  -H "Content-Type: application/json" \
  -d '{"input": "Test", "actual_output": "Test result"}'
```

## ⚙️ Configuration

All configuration is handled through environment variables. Copy `.env.example` to `.env` and modify as needed.

### Environment Variables

```bash
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434      # Ollama server URL
OLLAMA_MODEL=llama3.1:8b               # Default model to use
OLLAMA_TEMPERATURE=0.0                  # Model temperature

# OpenAI Configuration (optional)
OPENAI_API_KEY=your-openai-api-key     # OpenAI API key
OPENAI_MODEL=gpt-3.5-turbo             # Default OpenAI model
OPENAI_TEMPERATURE=0.0                 # OpenAI temperature

# Azure OpenAI Configuration (optional)
AZURE_OPENAI_API_KEY=your-azure-key    # Azure OpenAI API key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com  # Azure endpoint
AZURE_OPENAI_API_VERSION=2023-12-01-preview  # API version
AZURE_OPENAI_DEPLOYMENT=your-deployment  # Deployment name

# Service Configuration
SERVICE_HOST=0.0.0.0                   # Service bind host
SERVICE_PORT=8000                      # Service port
DEBUG=false                            # Debug mode

# API Configuration
API_TITLE=DeepEval Service            # API title
API_VERSION=1.0.0                     # API version

# Model Configuration
DEFAULT_MODEL_TIMEOUT=180             # Default timeout in seconds
```

### Configuration Priority
1. Environment variables (highest priority)
2. `.env` file values
3. Default values (lowest priority)

### Using Environment Variables
```bash
# Override defaults with environment variables
export OLLAMA_MODEL=llama3.1:70b
export SERVICE_PORT=9000
python main.py

# Or use a custom .env file
cp .env.example .env
# Edit .env with your values
python main.py
```

### Using Different Models

```bash
# Pull and use different models
docker exec ollama ollama pull llama3.1:8b     # Recommended default (good balance of quality/speed)
docker exec ollama ollama pull llama3.1:70b    # Higher quality, requires more resources
docker exec ollama ollama pull mistral:7b      # Alternative fast model
docker exec ollama ollama pull codellama:13b   # Good for code-related evaluations

# Update environment variable to use a different model
OLLAMA_MODEL=llama3.1:70b
```

**Model Recommendations:**
- **`llama3.1:8b`** - Default, good balance of quality and speed
- **`llama3.1:70b`** - Best quality, requires 40GB+ RAM
- **`mistral:7b`** - Fast alternative with good performance
- **`codellama:13b`** - Optimized for code-related evaluations

## 🐳 Docker Configuration

### Development Mode
```bash
# Run with auto-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production Mode
```bash
# Run optimized for production
docker-compose up -d
```

### Custom Build
```bash
# Build custom image
docker build -t deepeval-service:custom .

# Run with custom image
docker run -p 8000:8000 \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  deepeval-service:custom
```

## 🔍 Monitoring and Logs

### Check Service Status
```bash
# Check all services
docker-compose ps

# Check logs
docker-compose logs deepeval-service
docker-compose logs ollama

# Follow logs
docker-compose logs -f deepeval-service
```

### Health Checks
```bash
# Service health
curl http://localhost:8000/health

# Ollama health
curl http://localhost:11434/api/version
```

## 🛠️ Development

### Local Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Ollama separately
docker run -d -p 11434:11434 --name ollama ollama/ollama:latest

# Run development server
python main.py
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

## 🚨 Troubleshooting

### Common Issues

1. **Ollama not accessible**
   ```bash
   # Check if Ollama is running
   docker ps | grep ollama
   
   # Check Ollama logs
   docker logs ollama
   ```

2. **Model not found**
   ```bash
   # List available models
   docker exec ollama ollama list
   
   # Pull missing model
   docker exec ollama ollama pull llama3.1:8b
   ```

3. **Service not starting**
   ```bash
   # Check service logs
   docker-compose logs deepeval-service
   
   # Rebuild if needed
   docker-compose build --no-cache deepeval-service
   ```

4. **Memory issues**
   - Ensure Docker has at least 4GB RAM allocated
   - Consider using smaller models like `tinyllama`

### Performance Optimization

- Use GPU-enabled Ollama for faster inference
- Adjust `OLLAMA_TEMPERATURE` for your use case
- Use batch evaluation for multiple test cases
- Consider model size vs. accuracy trade-offs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Links

- [DeepEval Documentation](https://deepeval.com/)
- [Ollama Documentation](https://ollama.ai/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation at `/docs`