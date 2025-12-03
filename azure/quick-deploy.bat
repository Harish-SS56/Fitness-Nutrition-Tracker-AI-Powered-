@echo off
REM Quick deployment script for Windows users
REM This script will deploy the Fitness Tracker to Azure Container Apps

echo 🚀 Fitness Tracker - Quick Azure Deployment
echo.

REM Check if required parameters are provided
if "%1"=="" (
    echo ❌ Missing parameters
    echo.
    echo Usage: quick-deploy.bat DATABASE_URL GEMINI_API_KEY EMAIL_USER EMAIL_PASS
    echo.
    echo Example:
    echo quick-deploy.bat "postgresql://user:pass@host/db" "your_gemini_key" "your@email.com" "your_password"
    echo.
    pause
    exit /b 1
)

set DATABASE_URL=%1
set GEMINI_API_KEY=%2
set EMAIL_USER=%3
set EMAIL_PASS=%4

echo 📝 Configuration:
echo Database: %DATABASE_URL:~0,30%...
echo Gemini API Key: %GEMINI_API_KEY:~0,10%...
echo Email User: %EMAIL_USER%
echo.

REM Check if Azure CLI is installed
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Azure CLI is not installed
    echo Please install Azure CLI from: https://aka.ms/installazurecliwindows
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    echo Please start Docker Desktop
    pause
    exit /b 1
)

REM Check if logged in to Azure
az account show >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Azure
    echo Please run: az login
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Run the PowerShell deployment script
echo 🔨 Starting deployment...
powershell -ExecutionPolicy Bypass -File "deploy-to-azure.ps1" -DatabaseUrl %DATABASE_URL% -GeminiApiKey %GEMINI_API_KEY% -EmailUser %EMAIL_USER% -EmailPass %EMAIL_PASS%

if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo 🌐 Your Fitness Tracker is now running on Azure!
echo.
pause
