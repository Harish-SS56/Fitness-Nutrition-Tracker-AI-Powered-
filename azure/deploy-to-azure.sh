#!/bin/bash

# Bash script to deploy Fitness Tracker to Azure Container Apps
set -e

# Default values
RESOURCE_GROUP_NAME="fitness-tracker-rg"
LOCATION="East US"
ENVIRONMENT="prod"
SESSION_SECRET="fitness-tracker-$(date +%s)-secret"

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -g, --resource-group    Resource group name (default: fitness-tracker-rg)"
    echo "  -l, --location         Azure location (default: East US)"
    echo "  -e, --environment      Environment (default: prod)"
    echo "  -d, --database-url     Database URL (required)"
    echo "  -k, --gemini-key       Gemini API key (required)"
    echo "  -u, --email-user       Email user (required)"
    echo "  -p, --email-pass       Email password (required)"
    echo "  -s, --session-secret   Session secret (optional)"
    echo "  -h, --help             Show this help message"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP_NAME="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--database-url)
            DATABASE_URL="$2"
            shift 2
            ;;
        -k|--gemini-key)
            GEMINI_API_KEY="$2"
            shift 2
            ;;
        -u|--email-user)
            EMAIL_USER="$2"
            shift 2
            ;;
        -p|--email-pass)
            EMAIL_PASS="$2"
            shift 2
            ;;
        -s|--session-secret)
            SESSION_SECRET="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option $1"
            usage
            ;;
    esac
done

# Check required parameters
if [[ -z "$DATABASE_URL" || -z "$GEMINI_API_KEY" || -z "$EMAIL_USER" || -z "$EMAIL_PASS" ]]; then
    echo "❌ Missing required parameters"
    usage
fi

echo "🚀 Starting Azure deployment for Fitness Tracker"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Location: $LOCATION"
echo "Environment: $ENVIRONMENT"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi
echo "✅ Azure CLI is installed"

# Check if logged in to Azure
ACCOUNT=$(az account show --query "name" -o tsv 2>/dev/null || echo "")
if [[ -z "$ACCOUNT" ]]; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi
echo "✅ Logged in to Azure account: $ACCOUNT"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Create resource group
echo "📝 Creating resource group..."
az group create --name "$RESOURCE_GROUP_NAME" --location "$LOCATION"

# Deploy infrastructure using Bicep
echo "🔨 Deploying infrastructure with Bicep..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --template-file "bicep/main.bicep" \
    --parameters \
        namePrefix="fitness-tracker" \
        environment="$ENVIRONMENT" \
        location="$LOCATION" \
        databaseUrl="$DATABASE_URL" \
        geminiApiKey="$GEMINI_API_KEY" \
        emailUser="$EMAIL_USER" \
        emailPass="$EMAIL_PASS" \
        sessionSecret="$SESSION_SECRET" \
    --query "properties.outputs" -o json)

if [[ $? -ne 0 ]]; then
    echo "❌ Infrastructure deployment failed"
    exit 1
fi

# Extract outputs
REGISTRY_SERVER=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.containerRegistryLoginServer.value')
REGISTRY_NAME=$(echo "$REGISTRY_SERVER" | sed 's/\.azurecr\.io//')
REGISTRY_USERNAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.containerRegistryUsername.value')
REGISTRY_PASSWORD=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.containerRegistryPassword.value')

echo "✅ Infrastructure deployed successfully"
echo "Registry: $REGISTRY_SERVER"

# Login to Container Registry
echo "🔐 Logging into Container Registry..."
az acr login --name "$REGISTRY_NAME"

# Build and push frontend image
echo "🔨 Building and pushing frontend image..."
docker build -t "$REGISTRY_SERVER/fitness-tracker-frontend:latest" .
docker push "$REGISTRY_SERVER/fitness-tracker-frontend:latest"

# Build and push email service image
echo "🔨 Building and pushing email service image..."
docker build -t "$REGISTRY_SERVER/fitness-tracker-email-service:latest" ./python_email_service
docker push "$REGISTRY_SERVER/fitness-tracker-email-service:latest"

# Update container apps with new images
echo "🔄 Updating container apps..."

# Update frontend app
az containerapp update \
    --name "fitness-tracker-$ENVIRONMENT-frontend" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --image "$REGISTRY_SERVER/fitness-tracker-frontend:latest"

# Update email service app
az containerapp update \
    --name "fitness-tracker-$ENVIRONMENT-email-service" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --image "$REGISTRY_SERVER/fitness-tracker-email-service:latest"

# Get the application URL
FRONTEND_URL=$(az containerapp show \
    --name "fitness-tracker-$ENVIRONMENT-frontend" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query "properties.configuration.ingress.fqdn" \
    --output tsv)

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend URL: https://$FRONTEND_URL"
echo "📊 Monitor your application in the Azure Portal"

# Output deployment summary
echo ""
echo "📋 Deployment Summary:"
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Container Registry: $REGISTRY_SERVER"
echo "Frontend URL: https://$FRONTEND_URL"
echo "Environment: $ENVIRONMENT"
