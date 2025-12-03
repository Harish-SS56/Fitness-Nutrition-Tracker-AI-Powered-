@echo off
echo 🔧 VERBOSE TEST WITH OUTPUT
echo ===========================

cd python_email_service

echo.
echo 🔍 Testing Database Connection...
echo --------------------------------
python email_service.py test_db
echo Exit Code: %ERRORLEVEL%

echo.
echo 📧 Sending Emails to All Users...
echo ---------------------------------
python email_service.py send_daily_reminders
echo Exit Code: %ERRORLEVEL%

echo.
echo 📊 Checking Email Logs...
echo -------------------------
python debug_database.py

echo.
echo ✅ VERBOSE TEST COMPLETED!
pause
