@echo off
echo 🔧 EMAIL DATABASE FIX SCRIPT
echo ============================

echo.
echo 🔍 Step 1: Debug current database state
cd python_email_service
python debug_database.py

echo.
echo 👥 Step 2: Add/Update test users
python add_test_users.py

echo.
echo 🔍 Step 3: Test database connection again
python email_service.py test_db

echo.
echo 📧 Step 4: Test email sending to database users
python email_service.py send_daily_reminders

echo.
echo ✅ EMAIL DATABASE FIX COMPLETED!
echo.
pause
