@echo off
REM Build and Push Docker Images to Azure Container Registry (Windows)
REM Usage: build-and-push.bat <registry-name> <tag>

setlocal enabledelayedexpansion

REM Configuration
set REGISTRY_NAME=%1
if "%REGISTRY_NAME%"=="" set REGISTRY_NAME=fitness-tracker-prod-acr

set TAG=%2
if "%TAG%"=="" set TAG=latest

set REGISTRY_URL=%REGISTRY_NAME%.azurecr.io

echo 🚀 Building and pushing Docker images to Azure Container Registry
echo Registry: %REGISTRY_URL%
echo Tag: %TAG%

REM Login to Azure Container Registry
echo 📝 Logging into Azure Container Registry...
call az acr login --name %REGISTRY_NAME%
if %errorlevel% neq 0 (
    echo ❌ Failed to login to Azure Container Registry
    exit /b 1
)

REM Build and push frontend image
echo 🔨 Building frontend image...
call docker build -t %REGISTRY_URL%/fitness-tracker-frontend:%TAG% .
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend image
    exit /b 1
)

echo 📤 Pushing frontend image...
call docker push %REGISTRY_URL%/fitness-tracker-frontend:%TAG%
if %errorlevel% neq 0 (
    echo ❌ Failed to push frontend image
    exit /b 1
)

REM Build and push email service image
echo 🔨 Building email service image...
call docker build -t %REGISTRY_URL%/fitness-tracker-email-service:%TAG% ./python_email_service
if %errorlevel% neq 0 (
    echo ❌ Failed to build email service image
    exit /b 1
)

echo 📤 Pushing email service image...
call docker push %REGISTRY_URL%/fitness-tracker-email-service:%TAG%
if %errorlevel% neq 0 (
    echo ❌ Failed to push email service image
    exit /b 1
)

echo ✅ All images built and pushed successfully!
echo Frontend: %REGISTRY_URL%/fitness-tracker-frontend:%TAG%
echo Email Service: %REGISTRY_URL%/fitness-tracker-email-service:%TAG%

endlocal
