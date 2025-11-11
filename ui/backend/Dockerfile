FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY ui/backend/requirements.txt /app/requirements.txt
COPY requirements.txt /app/framework-requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r framework-requirements.txt

# Install Playwright browsers for UI testing
RUN pip install playwright && \
    playwright install --with-deps chromium

# Copy application code
COPY ui/backend /app/ui/backend
COPY framework /app/framework
COPY test_artifacts /app/test_artifacts

# Create results directory
RUN mkdir -p /app/test_results

# Expose port
EXPOSE 8002

# Run the application
CMD ["uvicorn", "ui.backend.main:app", "--host", "0.0.0.0", "--port", "8002"]
