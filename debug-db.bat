@echo off
echo 🔍 DATABASE DEBUG SCRIPT
echo ========================

cd python_email_service
python debug_database.py

echo.
echo 🔧 If no users found, let's check the email service query directly:
python email_service.py test_db

echo.
pause
