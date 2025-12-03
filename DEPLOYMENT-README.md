# Fitness Tracker - Docker & Azure Deployment Guide

This guide will help you containerize and deploy your fitness tracker application to Azure Container Apps.

## 🏗️ Architecture Overview

- **Frontend**: Next.js application (Port 3000)
- **Backend**: Python email service for notifications
- **Database**: Neon PostgreSQL (external)
- **Deployment**: Azure Container Apps with Container Registry

## 📋 Prerequisites

### Local Development
- Docker Desktop installed
- Node.js 18+ installed
- Python 3.11+ installed
- Azure CLI installed (`az --version`)

### Azure Requirements
- Azure subscription
- Azure CLI logged in (`az login`)
- Sufficient permissions to create resources

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and fill in your values:

```bash
cp env.example .env.local
```

Update `.env.local` with your actual values:
```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SESSION_SECRET=your_random_session_secret_here
```

### 2. Local Development with Docker

Build and run locally:

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at: http://localhost:3000

## 🌐 Azure Deployment

### Step 1: Prepare Azure Environment

1. **Login to Azure:**
```bash
az login
```

2. **Set your subscription:**
```bash
az account set --subscription "Your Subscription Name"
```

3. **Update Bicep parameters:**

Edit `bicep/parameters.json` with your actual values:
```json
{
  "databaseUrl": {
    "value": "YOUR_ACTUAL_DATABASE_URL"
  },
  "geminiApiKey": {
    "value": "YOUR_ACTUAL_GEMINI_API_KEY"
  },
  "emailUser": {
    "value": "YOUR_ACTUAL_EMAIL"
  },
  "emailPass": {
    "value": "YOUR_ACTUAL_EMAIL_PASSWORD"
  },
  "sessionSecret": {
    "value": "YOUR_ACTUAL_SESSION_SECRET"
  }
}
```

### Step 2: Deploy Infrastructure

**Windows:**
```cmd
scripts\deploy-azure.bat fitness-tracker-rg prod
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy-azure.sh
./scripts/deploy-azure.sh fitness-tracker-rg prod
```

### Step 3: Build and Push Images

**Windows:**
```cmd
scripts\build-and-push.bat fitness-tracker-prod-acr latest
```

**Linux/Mac:**
```bash
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh fitness-tracker-prod-acr latest
```

### Step 4: Update Container Apps

After pushing images, update the container apps:

```bash
# Update frontend
az containerapp update \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --image fitness-tracker-prod-acr.azurecr.io/fitness-tracker-frontend:latest

# Update email service
az containerapp update \
  --name fitness-tracker-prod-email-service \
  --resource-group fitness-tracker-rg \
  --image fitness-tracker-prod-acr.azurecr.io/fitness-tracker-email-service:latest
```

## 🔧 Manual Deployment Steps

### 1. Create Resource Group
```bash
az group create --name fitness-tracker-rg --location "East US"
```

### 2. Create Container Registry
```bash
az acr create \
  --resource-group fitness-tracker-rg \
  --name fitness-tracker-prod-acr \
  --sku Basic \
  --admin-enabled true
```

### 3. Create Container Apps Environment
```bash
az containerapp env create \
  --name fitness-tracker-prod-env \
  --resource-group fitness-tracker-rg \
  --location "East US"
```

### 4. Deploy Container Apps
```bash
# Deploy frontend
az containerapp create \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --environment fitness-tracker-prod-env \
  --image fitness-tracker-prod-acr.azurecr.io/fitness-tracker-frontend:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server fitness-tracker-prod-acr.azurecr.io \
  --env-vars NODE_ENV=production DATABASE_URL=secretref:database-url \
  --secrets database-url="YOUR_DATABASE_URL"

# Deploy email service
az containerapp create \
  --name fitness-tracker-prod-email-service \
  --resource-group fitness-tracker-rg \
  --environment fitness-tracker-prod-env \
  --image fitness-tracker-prod-acr.azurecr.io/fitness-tracker-email-service:latest \
  --registry-server fitness-tracker-prod-acr.azurecr.io \
  --env-vars DATABASE_URL=secretref:database-url \
  --secrets database-url="YOUR_DATABASE_URL"
```

## 🔍 Monitoring & Troubleshooting

### View Application Logs
```bash
# Frontend logs
az containerapp logs show \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --follow

# Email service logs
az containerapp logs show \
  --name fitness-tracker-prod-email-service \
  --resource-group fitness-tracker-rg \
  --follow
```

### Check Application Status
```bash
az containerapp show \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --query properties.configuration.ingress.fqdn
```

### Scale Applications
```bash
# Scale frontend
az containerapp update \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --min-replicas 1 \
  --max-replicas 5

# Scale email service
az containerapp update \
  --name fitness-tracker-prod-email-service \
  --resource-group fitness-tracker-rg \
  --min-replicas 1 \
  --max-replicas 1
```

## 🔐 Security Best Practices

1. **Environment Variables**: Store sensitive data in Azure Key Vault
2. **Container Registry**: Use managed identity for authentication
3. **Network Security**: Configure virtual networks and firewall rules
4. **SSL/TLS**: Enable HTTPS for all external endpoints
5. **Monitoring**: Set up Azure Monitor and Application Insights

## 💰 Cost Optimization

1. **Right-sizing**: Start with minimal resources and scale as needed
2. **Auto-scaling**: Configure based on CPU/memory usage
3. **Reserved Instances**: Consider for production workloads
4. **Resource Cleanup**: Remove unused resources regularly

## 🚨 Common Issues

### Build Failures
- Check Docker daemon is running
- Verify all dependencies in package.json
- Ensure .env.local is properly configured

### Deployment Failures
- Verify Azure CLI is logged in
- Check resource quotas and limits
- Validate Bicep template syntax

### Runtime Issues
- Check container logs for errors
- Verify environment variables are set
- Test database connectivity

## 📞 Support

For issues with:
- **Azure**: Check Azure documentation or contact Azure support
- **Docker**: Refer to Docker documentation
- **Application**: Check application logs and error messages

## 🔄 CI/CD Pipeline (Optional)

Consider setting up GitHub Actions or Azure DevOps for automated deployments:

1. **Build**: Automatically build Docker images on code push
2. **Test**: Run automated tests
3. **Deploy**: Deploy to staging/production environments
4. **Monitor**: Set up alerts and monitoring

---

**Next Steps:**
1. Set up monitoring and alerting
2. Configure custom domain and SSL
3. Implement backup and disaster recovery
4. Set up CI/CD pipeline for automated deployments
