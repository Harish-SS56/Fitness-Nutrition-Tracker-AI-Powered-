# PowerShell script to deploy Fitness Tracker to Azure Container Apps
param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName = "fitness-tracker-rg",
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$false)]
    [string]$Environment = "prod",
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$GeminiApiKey,
    
    [Parameter(Mandatory=$true)]
    [string]$EmailUser,
    
    [Parameter(Mandatory=$true)]
    [string]$EmailPass,
    
    [Parameter(Mandatory=$false)]
    [string]$SessionSecret = "fitness-tracker-$(Get-Random)-secret"
)

Write-Host "🚀 Starting Azure deployment for Fitness Tracker" -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Location: $Location" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Host "✅ Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
$account = az account show --query "name" -o tsv 2>$null
if (-not $account) {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in to Azure account: $account" -ForegroundColor Green

# Create resource group
Write-Host "📝 Creating resource group..." -ForegroundColor Blue
az group create --name $ResourceGroupName --location $Location
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

# Deploy infrastructure using Bicep
Write-Host "🔨 Deploying infrastructure with Bicep..." -ForegroundColor Blue
$deploymentResult = az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "bicep/main.bicep" `
    --parameters `
        namePrefix="fitness-tracker" `
        environment=$Environment `
        location=$Location `
        databaseUrl=$DatabaseUrl `
        geminiApiKey=$GeminiApiKey `
        emailUser=$EmailUser `
        emailPass=$EmailPass `
        sessionSecret=$SessionSecret `
    --query "properties.outputs" -o json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Infrastructure deployment failed" -ForegroundColor Red
    exit 1
}

$outputs = $deploymentResult | ConvertFrom-Json
$registryName = $outputs.containerRegistryLoginServer.value -replace "\.azurecr\.io", ""
$registryServer = $outputs.containerRegistryLoginServer.value
$registryUsername = $outputs.containerRegistryUsername.value
$registryPassword = $outputs.containerRegistryPassword.value

Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
Write-Host "Registry: $registryServer" -ForegroundColor Yellow

# Login to Container Registry
Write-Host "🔐 Logging into Container Registry..." -ForegroundColor Blue
az acr login --name $registryName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Container Registry" -ForegroundColor Red
    exit 1
}

# Build and push frontend image
Write-Host "🔨 Building and pushing frontend image..." -ForegroundColor Blue
docker build -t "$registryServer/fitness-tracker-frontend:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend image" -ForegroundColor Red
    exit 1
}

docker push "$registryServer/fitness-tracker-frontend:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push frontend image" -ForegroundColor Red
    exit 1
}

# Build and push email service image
Write-Host "🔨 Building and pushing email service image..." -ForegroundColor Blue
docker build -t "$registryServer/fitness-tracker-email-service:latest" ./python_email_service
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build email service image" -ForegroundColor Red
    exit 1
}

docker push "$registryServer/fitness-tracker-email-service:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push email service image" -ForegroundColor Red
    exit 1
}

# Update container apps with new images
Write-Host "🔄 Updating container apps..." -ForegroundColor Blue

# Update frontend app
az containerapp update `
    --name "fitness-tracker-$Environment-frontend" `
    --resource-group $ResourceGroupName `
    --image "$registryServer/fitness-tracker-frontend:latest"

# Update email service app
az containerapp update `
    --name "fitness-tracker-$Environment-email-service" `
    --resource-group $ResourceGroupName `
    --image "$registryServer/fitness-tracker-email-service:latest"

# Get the application URL
$frontendUrl = az containerapp show `
    --name "fitness-tracker-$Environment-frontend" `
    --resource-group $ResourceGroupName `
    --query "properties.configuration.ingress.fqdn" `
    --output tsv

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend URL: https://$frontendUrl" -ForegroundColor Cyan
Write-Host "📊 Monitor your application in the Azure Portal" -ForegroundColor Yellow

# Output deployment summary
Write-Host "`n📋 Deployment Summary:" -ForegroundColor Magenta
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "Container Registry: $registryServer" -ForegroundColor White
Write-Host "Frontend URL: https://$frontendUrl" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor White
