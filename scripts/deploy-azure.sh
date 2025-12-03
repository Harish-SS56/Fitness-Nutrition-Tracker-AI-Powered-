#!/bin/bash

# Deploy Fitness Tracker to Azure Container Apps
# Usage: ./deploy-azure.sh <resource-group> <environment>

set -e

# Configuration
RESOURCE_GROUP=${1:-"fitness-tracker-rg"}
ENVIRONMENT=${2:-"prod"}
LOCATION="East US"

echo "🚀 Deploying Fitness Tracker to Azure Container Apps"
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Environment: ${ENVIRONMENT}"
echo "Location: ${LOCATION}"

# Create resource group if it doesn't exist
echo "📝 Creating resource group..."
az group create --name ${RESOURCE_GROUP} --location "${LOCATION}"

# Deploy using Bicep template
echo "🔨 Deploying infrastructure with Bicep..."
az deployment group create \
  --resource-group ${RESOURCE_GROUP} \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.json \
  --parameters environment=${ENVIRONMENT}

echo "✅ Deployment completed successfully!"

# Get the frontend URL
FRONTEND_URL=$(az deployment group show \
  --resource-group ${RESOURCE_GROUP} \
  --name main \
  --query properties.outputs.frontendUrl.value \
  --output tsv)

echo "🌐 Frontend URL: https://${FRONTEND_URL}"
echo "📊 Check deployment status in Azure Portal"
