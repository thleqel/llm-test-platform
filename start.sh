#!/bin/bash

# LLM Test Platform - Quick Start Script

set -e

echo "🚀 Starting LLM Test Platform..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "${YELLOW}Warning: docker-compose not found. Please install Docker and Docker Compose.${NC}"
    exit 1
fi

# Start all services
echo "${BLUE}Starting services with Docker Compose...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo "${BLUE}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo "${BLUE}Checking service health...${NC}"

if curl -s http://localhost:11434 > /dev/null; then
    echo "${GREEN}✓ Ollama is running on http://localhost:11434${NC}"
else
    echo "${YELLOW}⚠ Ollama may not be ready yet${NC}"
fi

if curl -s http://localhost:8001/health > /dev/null; then
    echo "${GREEN}✓ DeepEval Service is running on http://localhost:8001${NC}"
else
    echo "${YELLOW}⚠ DeepEval Service may not be ready yet${NC}"
fi

if curl -s http://localhost:8002/health > /dev/null; then
    echo "${GREEN}✓ UI Backend is running on http://localhost:8002${NC}"
else
    echo "${YELLOW}⚠ UI Backend may not be ready yet${NC}"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "${GREEN}✓ UI Frontend is running on http://localhost:3000${NC}"
else
    echo "${YELLOW}⚠ UI Frontend may not be ready yet${NC}"
fi

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}  LLM Test Platform is starting!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "📊 Web UI:              http://localhost:3000"
echo "🔧 Backend API:         http://localhost:8002"
echo "📖 API Docs:            http://localhost:8002/docs"
echo "🤖 DeepEval Service:    http://localhost:8001"
echo "🦙 Ollama:              http://localhost:11434"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose down"
echo ""
