FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry

# Configure poetry
RUN poetry config virtualenvs.create false

# Copy poetry configuration files
COPY pyproject.toml poetry.lock* ./

# Install dependencies
RUN poetry install --no-root

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--reload"]
