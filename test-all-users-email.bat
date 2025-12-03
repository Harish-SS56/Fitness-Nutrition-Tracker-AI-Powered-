@echo off
echo 📧 SEND EMAILS TO ALL 7 USERS FROM DATABASE
echo ============================================

cd python_email_service

echo.
echo 🔍 Step 1: Test database connection (should find 7 users now)
python email_service.py test_db

echo.
echo 📧 Step 2: Send daily reminders to ALL 7 users from database
python email_service.py send_daily_reminders

echo.
echo 🏆 Step 3: Send test achievement email to Harini
python email_service.py send_achievement hk6113367@gmail.com harini "Database Integration Success" "Your email system is now perfectly integrated with the database!"

echo.
echo ✅ ALL USERS EMAIL TEST COMPLETED!
echo Check all 7 email inboxes for messages.
echo.
pause
