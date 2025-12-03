#!/bin/bash

# Azure Resources Cleanup Script
# Usage: ./azure-resources-cleanup.sh <resource-group>

set -e

RESOURCE_GROUP=${1:-"fitness-tracker-rg"}

echo "⚠️  WARNING: This will delete ALL resources in resource group: ${RESOURCE_GROUP}"
echo "This action cannot be undone!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo "🗑️  Deleting resource group: ${RESOURCE_GROUP}"
echo "This may take several minutes..."

az group delete --name ${RESOURCE_GROUP} --yes --no-wait

echo "✅ Resource group deletion initiated"
echo "💡 You can check the deletion status in the Azure Portal"
echo "💡 Or run: az group show --name ${RESOURCE_GROUP} --query properties.provisioningState"
