#!/bin/bash

# Build and Push Docker Images to Azure Container Registry
# Usage: ./build-and-push.sh <registry-name> <tag>

set -e

# Configuration
REGISTRY_NAME=${1:-"fitness-tracker-prod-acr"}
TAG=${2:-"latest"}
REGISTRY_URL="${REGISTRY_NAME}.azurecr.io"

echo "🚀 Building and pushing Docker images to Azure Container Registry"
echo "Registry: ${REGISTRY_URL}"
echo "Tag: ${TAG}"

# Login to Azure Container Registry
echo "📝 Logging into Azure Container Registry..."
az acr login --name ${REGISTRY_NAME}

# Build and push frontend image
echo "🔨 Building frontend image..."
docker build -t ${REGISTRY_URL}/fitness-tracker-frontend:${TAG} .

echo "📤 Pushing frontend image..."
docker push ${REGISTRY_URL}/fitness-tracker-frontend:${TAG}

# Build and push email service image
echo "🔨 Building email service image..."
docker build -t ${REGISTRY_URL}/fitness-tracker-email-service:${TAG} ./python_email_service

echo "📤 Pushing email service image..."
docker push ${REGISTRY_URL}/fitness-tracker-email-service:${TAG}

echo "✅ All images built and pushed successfully!"
echo "Frontend: ${REGISTRY_URL}/fitness-tracker-frontend:${TAG}"
echo "Email Service: ${REGISTRY_URL}/fitness-tracker-email-service:${TAG}"
