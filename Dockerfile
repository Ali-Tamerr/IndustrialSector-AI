FROM python:3.11-slim

# Install system dependencies and Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files
COPY . .

# Install node dependencies and build Next.js
RUN npm install
RUN npm run build

# Hugging Face Spaces require port 7860 to be exposed
EXPOSE 7860

# Start the Next.js production server on port 7860
CMD ["npx", "next", "start", "-p", "7860"]
