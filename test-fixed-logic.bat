@echo off
echo 🔧 TESTING FIXED EMAIL LOGIC
echo ============================

cd python_email_service

echo.
echo 🔍 Step 1: Test Fixed Logic (Should find ALL 7 users now)
python test_fixed_logic.py

echo.
echo 📧 Step 2: Send Emails with Fixed Logic
python email_service.py send_daily_reminders

echo.
echo ✅ FIXED LOGIC TEST COMPLETED!
echo Now ALL users with emails should receive personalized reminders.
echo.
pause
