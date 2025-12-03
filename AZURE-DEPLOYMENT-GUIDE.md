# 🚀 Azure Container Apps Deployment Guide - Fitness Tracker

This comprehensive guide will help you containerize and deploy your fitness tracker application to Azure Container Apps with full production-ready configuration.

## 📋 Prerequisites

### Required Software
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Azure CLI** - [Download here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Git** (optional) - For version control

### Azure Requirements
- **Azure Subscription** with sufficient permissions
- **Resource creation permissions** in your subscription
- **Container Apps** service available in your region

## 🏗️ Architecture Overview

Your fitness tracker will be deployed with this architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Container Apps                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Frontend      │    │     Email Service               │ │
│  │   (Next.js)     │    │     (Python)                    │ │
│  │   Port: 3000    │    │     Background Service          │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              Azure Container Registry (ACR)                 │
├─────────────────────────────────────────────────────────────┤
│              Log Analytics Workspace                        │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────────────┐
                    │  Neon Database  │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

## 🚀 Quick Deployment (Windows Users)

### Option 1: Super Quick Deploy
1. **Open Command Prompt** as Administrator
2. **Navigate to your project folder**:
   ```cmd
   cd "n:\fitness-tracker (1)"
   ```
3. **Run the quick deploy script**:
   ```cmd
   azure\quick-deploy.bat "YOUR_DATABASE_URL" "YOUR_GEMINI_API_KEY" "YOUR_EMAIL" "YOUR_EMAIL_PASSWORD"
   ```

### Option 2: PowerShell Deploy
```powershell
cd "n:\fitness-tracker (1)"
.\azure\deploy-to-azure.ps1 `
  -DatabaseUrl "YOUR_DATABASE_URL" `
  -GeminiApiKey "YOUR_GEMINI_API_KEY" `
  -EmailUser "YOUR_EMAIL" `
  -EmailPass "YOUR_EMAIL_PASSWORD"
```

## 🐧 Linux/Mac Deployment

```bash
cd /path/to/fitness-tracker
chmod +x azure/deploy-to-azure.sh
./azure/deploy-to-azure.sh \
  --database-url "YOUR_DATABASE_URL" \
  --gemini-key "YOUR_GEMINI_API_KEY" \
  --email-user "YOUR_EMAIL" \
  --email-pass "YOUR_EMAIL_PASSWORD"
```

## 📝 Step-by-Step Manual Deployment

### Step 1: Prepare Your Environment

1. **Login to Azure**:
   ```bash
   az login
   ```

2. **Set your subscription**:
   ```bash
   az account set --subscription "Your Subscription Name"
   ```

3. **Verify Docker is running**:
   ```bash
   docker --version
   ```

### Step 2: Configure Your Application

1. **Copy the environment template**:
   ```bash
   cp azure/env.azure.example .env.local
   ```

2. **Edit `.env.local`** with your actual values:
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   GEMINI_API_KEY=your_actual_gemini_api_key
   EMAIL_USER=harishdeepikassdeepikass@gmail.com
   EMAIL_PASS=vqsv erqr tstj mvdt
   SESSION_SECRET=your_secure_session_secret
   ```

### Step 3: Deploy Infrastructure

1. **Create Resource Group**:
   ```bash
   az group create --name fitness-tracker-rg --location "East US"
   ```

2. **Deploy with Bicep**:
   ```bash
   az deployment group create \
     --resource-group fitness-tracker-rg \
     --template-file bicep/main.bicep \
     --parameters bicep/parameters.json
   ```

### Step 4: Build and Push Container Images

1. **Get registry details**:
   ```bash
   REGISTRY_NAME=$(az acr list --resource-group fitness-tracker-rg --query "[0].name" -o tsv)
   REGISTRY_SERVER="$REGISTRY_NAME.azurecr.io"
   ```

2. **Login to registry**:
   ```bash
   az acr login --name $REGISTRY_NAME
   ```

3. **Build and push frontend**:
   ```bash
   docker build -t $REGISTRY_SERVER/fitness-tracker-frontend:latest .
   docker push $REGISTRY_SERVER/fitness-tracker-frontend:latest
   ```

4. **Build and push email service**:
   ```bash
   docker build -t $REGISTRY_SERVER/fitness-tracker-email-service:latest ./python_email_service
   docker push $REGISTRY_SERVER/fitness-tracker-email-service:latest
   ```

### Step 5: Update Container Apps

1. **Update frontend app**:
   ```bash
   az containerapp update \
     --name fitness-tracker-prod-frontend \
     --resource-group fitness-tracker-rg \
     --image $REGISTRY_SERVER/fitness-tracker-frontend:latest
   ```

2. **Update email service**:
   ```bash
   az containerapp update \
     --name fitness-tracker-prod-email-service \
     --resource-group fitness-tracker-rg \
     --image $REGISTRY_SERVER/fitness-tracker-email-service:latest
   ```

### Step 6: Get Your Application URL

```bash
az containerapp show \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

## 🔧 Local Development with Docker

### Test Locally Before Deployment

1. **Build and run locally**:
   ```bash
   docker-compose up --build
   ```

2. **Access your app**:
   - Frontend: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**:
   ```bash
   docker-compose down
   ```

## 📊 Monitoring and Management

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

### Check Application Health
```bash
# Check container app status
az containerapp show \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --query "properties.runningStatus"

# Check health endpoint
curl -f https://YOUR_APP_URL/api/health
```

### Scale Your Application
```bash
# Scale frontend (1-10 replicas)
az containerapp update \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --min-replicas 1 \
  --max-replicas 5

# Email service (keep at 1 replica)
az containerapp update \
  --name fitness-tracker-prod-email-service \
  --resource-group fitness-tracker-rg \
  --min-replicas 1 \
  --max-replicas 1
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Store sensitive data in Azure Key Vault
- Use managed identities when possible
- Rotate secrets regularly

### 2. Network Security
- Enable HTTPS only
- Configure custom domains with SSL
- Use Azure Front Door for additional security

### 3. Container Security
- Use non-root users in containers
- Scan images for vulnerabilities
- Keep base images updated

## 💰 Cost Optimization

### 1. Right-sizing Resources
- Start with minimal CPU/memory allocation
- Monitor usage and adjust as needed
- Use consumption-based pricing

### 2. Auto-scaling Configuration
```bash
# Configure CPU-based scaling
az containerapp update \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --scale-rule-name cpu-scaling \
  --scale-rule-type cpu \
  --scale-rule-metadata concurrentRequests=30
```

### 3. Resource Management
- Delete unused resources regularly
- Use Azure Cost Management for monitoring
- Set up budget alerts

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check Docker daemon
docker info

# Verify Dockerfile syntax
docker build --no-cache -t test .
```

#### 2. Deployment Failures
```bash
# Check Azure CLI login
az account show

# Verify resource quotas
az vm list-usage --location "East US"
```

#### 3. Runtime Issues
```bash
# Check container logs
az containerapp logs show --name YOUR_APP_NAME --resource-group YOUR_RG

# Test database connectivity
az containerapp exec --name YOUR_APP_NAME --resource-group YOUR_RG --command "/bin/bash"
```

#### 4. Email Service Issues
```bash
# Test email service manually
az containerapp exec \
  --name fitness-tracker-prod-email-service \
  --resource-group fitness-tracker-rg \
  --command "python email_service.py test"
```

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
# Rebuild and push new images
docker build -t $REGISTRY_SERVER/fitness-tracker-frontend:v2 .
docker push $REGISTRY_SERVER/fitness-tracker-frontend:v2

# Update container app
az containerapp update \
  --name fitness-tracker-prod-frontend \
  --resource-group fitness-tracker-rg \
  --image $REGISTRY_SERVER/fitness-tracker-frontend:v2
```

### Backup and Recovery
- Database: Use Neon's built-in backup features
- Container Images: Stored in Azure Container Registry
- Configuration: Version control your Bicep templates

## 🧹 Cleanup Resources

### Delete Everything
```bash
# Warning: This deletes ALL resources in the resource group
az group delete --name fitness-tracker-rg --yes --no-wait
```

### Selective Cleanup
```bash
# Delete specific container app
az containerapp delete --name fitness-tracker-prod-frontend --resource-group fitness-tracker-rg

# Delete container registry
az acr delete --name YOUR_REGISTRY_NAME --resource-group fitness-tracker-rg
```

## 📞 Support and Next Steps

### Getting Help
- **Azure Documentation**: [Container Apps docs](https://docs.microsoft.com/en-us/azure/container-apps/)
- **Azure Support**: Create support tickets in Azure Portal
- **Community**: Stack Overflow with `azure-container-apps` tag

### Recommended Next Steps
1. **Set up CI/CD pipeline** with GitHub Actions
2. **Configure custom domain** and SSL certificate
3. **Implement monitoring** with Application Insights
4. **Set up backup strategy** for your database
5. **Configure alerts** for application health

---

## 🎉 Congratulations!

Your Fitness Tracker is now running on Azure Container Apps with:
- ✅ **Scalable architecture** with auto-scaling
- ✅ **Production-ready configuration** with health checks
- ✅ **Secure deployment** with managed secrets
- ✅ **Monitoring and logging** with Azure Monitor
- ✅ **Cost-optimized** resource allocation

Your application is now accessible worldwide with enterprise-grade reliability! 🌍
