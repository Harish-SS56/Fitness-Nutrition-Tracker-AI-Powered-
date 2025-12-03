// Azure Bicep template for Fitness Tracker deployment
@description('Location for all resources')
param location string = resourceGroup().location

@description('Name prefix for all resources')
param namePrefix string = 'fitness-tracker'

@description('Environment name (dev, staging, prod)')
param environment string = 'prod'

@description('Database connection string')
@secure()
param databaseUrl string

@description('Gemini API Key')
@secure()
param geminiApiKey string

@description('Email user')
@secure()
param emailUser string

@description('Email password')
@secure()
param emailPass string

@description('Session secret')
@secure()
param sessionSecret string

@description('Container registry name')
param containerRegistryName string = '${namePrefix}${environment}acr${uniqueString(resourceGroup().id)}'

@description('Enable monitoring and logging')
param enableMonitoring bool = true

// Variables
var resourceBaseName = '${namePrefix}-${environment}'
var containerAppEnvName = '${resourceBaseName}-env'
var logAnalyticsWorkspaceName = '${resourceBaseName}-logs'

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// Container Apps Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2022-10-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// Frontend Container App
resource frontendContainerApp 'Microsoft.App/containerApps@2022-10-01' = {
  name: '${resourceBaseName}-frontend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'gemini-api-key'
          value: geminiApiKey
        }
        {
          name: 'email-user'
          value: emailUser
        }
        {
          name: 'email-pass'
          value: emailPass
        }
        {
          name: 'session-secret'
          value: sessionSecret
        }
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
      ]
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'registry-password'
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/fitness-tracker-frontend:latest'
          name: 'frontend'
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'GEMINI_API_KEY'
              secretRef: 'gemini-api-key'
            }
            {
              name: 'EMAIL_HOST'
              value: 'smtp.gmail.com'
            }
            {
              name: 'EMAIL_PORT'
              value: '587'
            }
            {
              name: 'EMAIL_USER'
              secretRef: 'email-user'
            }
            {
              name: 'EMAIL_PASS'
              secretRef: 'email-pass'
            }
            {
              name: 'SESSION_SECRET'
              secretRef: 'session-secret'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// Email Service Container App
resource emailServiceContainerApp 'Microsoft.App/containerApps@2022-10-01' = {
  name: '${resourceBaseName}-email-service'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'email-user'
          value: emailUser
        }
        {
          name: 'email-pass'
          value: emailPass
        }
        {
          name: 'registry-password'
          value: containerRegistry.listCredentials().passwords[0].value
        }
      ]
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: containerRegistry.listCredentials().username
          passwordSecretRef: 'registry-password'
        }
      ]
    }
    template: {
      containers: [
        {
          image: '${containerRegistry.properties.loginServer}/fitness-tracker-email-service:latest'
          name: 'email-service'
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'EMAIL_HOST'
              value: 'smtp.gmail.com'
            }
            {
              name: 'EMAIL_PORT'
              value: '587'
            }
            {
              name: 'EMAIL_USER'
              secretRef: 'email-user'
            }
            {
              name: 'EMAIL_PASS'
              secretRef: 'email-pass'
            }
          ]
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

// Outputs
output frontendUrl string = frontendContainerApp.properties.configuration.ingress.fqdn
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerRegistryUsername string = containerRegistry.listCredentials().username
output containerRegistryPassword string = containerRegistry.listCredentials().passwords[0].value
