@echo off
echo 🧪 COMPREHENSIVE EMAIL SYSTEM TEST
echo ====================================

echo.
echo 📧 Email Configuration:
echo    📮 From: harishdeepikassdeepikass@gmail.com
echo    🔑 Password: vqsv erqr tstj mvdt
echo    🎯 Recipients: hk6113367@gmail.com, harishdeepikassdeepikass@gmail.com

echo.
echo 🔍 Running Python Email Tests...
echo ====================================

cd python_email_service

echo.
echo ⚡ Test 1: Database Connection
python email_service.py test_db

echo.
echo ⚡ Test 2: SMTP Connection  
python email_service.py test

echo.
echo ⚡ Test 3: Send Test Email to Harini
python email_service.py send_reminder hk6113367@gmail.com Harini 1358 180

echo.
echo ⚡ Test 4: Send Test Email to Harish
python email_service.py send_reminder harishdeepikassdeepikass@gmail.com Harish 2356 180

echo.
echo ⚡ Test 5: Send Achievement Email
python email_service.py send_achievement hk6113367@gmail.com Harini "Daily Calorie Goal" "You met your daily calorie goal!"

echo.
echo ⚡ Test 6: Send Daily Reminders to ALL Users
python email_service.py send_daily_reminders

echo.
echo ⚡ Test 7: Run Instant Test Script
python test_email_now.py

cd ..

echo.
echo 🎉 EMAIL SYSTEM TEST COMPLETED!
echo Check your email inboxes for test messages.
echo.
pause
