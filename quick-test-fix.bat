@echo off
echo 🔧 QUICK TEST AFTER DATABASE FIX
echo =================================

cd python_email_service

echo.
echo 🔍 Step 1: Test Database Connection (Should find 7 users now)
python email_service.py test_db

echo.
echo 📧 Step 2: Send Emails to ALL Users from Database
python email_service.py send_daily_reminders

echo.
echo ✅ QUICK TEST COMPLETED!
echo The KeyError should be fixed now and all 7 users should receive emails.
echo.
pause
