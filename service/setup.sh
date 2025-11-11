#!/bin/bash

# Setup script for DeepEval Service with Ollama

echo "🚀 Setting up DeepEval Service with Ollama..."

# Function to check if Ollama is running
check_ollama() {
    curl -s http://localhost:11434/api/version > /dev/null 2>&1
    return $?
}

# Function to wait for Ollama to be ready
wait_for_ollama() {
    echo "⏳ Waiting for Ollama to be ready..."
    local retries=30
    local count=0
    
    while [ $count -lt $retries ]; do
        if check_ollama; then
            echo "✅ Ollama is ready!"
            return 0
        fi
        echo "   Attempt $((count + 1))/$retries: Ollama not ready yet..."
        sleep 2
        count=$((count + 1))
    done
    
    echo "❌ Ollama failed to start after $retries attempts"
    return 1
}

# Function to pull Ollama model
pull_model() {
    local model=${1:-"llama3.1:8b"}
    echo "📥 Pulling Ollama model: $model"
    
    if curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"$model\"}" -H "Content-Type: application/json" > /dev/null 2>&1; then
        echo "✅ Model $model pulled successfully!"
        return 0
    else
        echo "❌ Failed to pull model $model"
        return 1
    fi
}

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for Ollama
if wait_for_ollama; then
    # Pull the default model
    pull_model "llama3.1:8b"
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📋 Service URLs:"
    echo "   - DeepEval Service: http://localhost:8001"
    echo "   - API Documentation: http://localhost:8001/docs"
    echo "   - Ollama API: http://localhost:11434"
    echo ""
    echo "📖 Example API call:"
    echo "   curl -X POST \"http://localhost:8001/api/v1/evaluation/single\" \\"
    echo "        -H \"Content-Type: application/json\" \\"
    echo "        -d '{\"input\": \"What is the capital of France?\", \"actual_output\": \"Paris is the capital of France.\"}'"
    echo ""
else
    echo "❌ Setup failed - Ollama did not start properly"
    exit 1
fi