@echo off
REM Deploy Fitness Tracker to Azure Container Apps (Windows)
REM Usage: deploy-azure.bat <resource-group> <environment>

setlocal enabledelayedexpansion

REM Configuration
set RESOURCE_GROUP=%1
if "%RESOURCE_GROUP%"=="" set RESOURCE_GROUP=fitness-tracker-rg

set ENVIRONMENT=%2
if "%ENVIRONMENT%"=="" set ENVIRONMENT=prod

set LOCATION=East US

echo 🚀 Deploying Fitness Tracker to Azure Container Apps
echo Resource Group: %RESOURCE_GROUP%
echo Environment: %ENVIRONMENT%
echo Location: %LOCATION%

REM Create resource group if it doesn't exist
echo 📝 Creating resource group...
call az group create --name %RESOURCE_GROUP% --location "%LOCATION%"
if %errorlevel% neq 0 (
    echo ❌ Failed to create resource group
    exit /b 1
)

REM Deploy using Bicep template
echo 🔨 Deploying infrastructure with Bicep...
call az deployment group create --resource-group %RESOURCE_GROUP% --template-file bicep/main.bicep --parameters bicep/parameters.json --parameters environment=%ENVIRONMENT%
if %errorlevel% neq 0 (
    echo ❌ Failed to deploy infrastructure
    exit /b 1
)

echo ✅ Deployment completed successfully!

REM Get the frontend URL
for /f "tokens=*" %%i in ('az deployment group show --resource-group %RESOURCE_GROUP% --name main --query properties.outputs.frontendUrl.value --output tsv') do set FRONTEND_URL=%%i

echo 🌐 Frontend URL: https://%FRONTEND_URL%
echo 📊 Check deployment status in Azure Portal

endlocal
