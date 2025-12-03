# Python Email Service Dockerfile for Fitness Tracker
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl \
        cron \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose port for health checks
EXPOSE 8000

# Health check - test database connection and email service
HEALTHCHECK --interval=60s --timeout=30s --start-period=10s --retries=3 \
    CMD python email_service.py test || exit 1

# Create startup script
COPY --chown=appuser:appuser <<EOF /app/start.sh
#!/bin/bash
echo "Starting Fitness Tracker Email Service..."
echo "Testing database connection..."
python email_service.py test_db
echo "Testing email connection..."  
python email_service.py test
echo "Starting email scheduler..."
python email_scheduler.py
EOF

RUN chmod +x /app/start.sh

# Default command - run the email scheduler
CMD ["/app/start.sh"]
