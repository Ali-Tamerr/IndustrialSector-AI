FROM python:3.11-slim

# Install system dependencies for PostgreSQL compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files (React frontend, python assets, databases)
COPY . .

# Hugging Face Spaces require port 7860 to be exposed
EXPOSE 7860

# Start the dashboard and API server on port 7860
CMD ["python", "server.py", "7860"]
