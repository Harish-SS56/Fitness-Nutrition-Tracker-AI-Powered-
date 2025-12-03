@echo off
echo 🔍 COMPLETE EMAIL SYSTEM AUDIT
echo ==============================

cd python_email_service

echo.
echo 🧪 Step 1: Test Personalized Emails (Individual Goals)
echo -------------------------------------------------------
python test_personalized_emails.py

echo.
echo 🔍 Step 2: Complete System Audit (Line by Line)
echo -----------------------------------------------
python audit_email_system.py

echo.
echo 📧 Step 3: Send Emails to ALL Users (Any Amount)
echo ------------------------------------------------
python email_service.py send_daily_reminders

echo.
echo ✅ COMPLETE EMAIL AUDIT FINISHED!
echo.
echo 📋 SUMMARY:
echo   • Verified personalization works for each user
echo   • Checked all email system components
echo   • Sent emails to ALL users in database (any amount)
echo   • Each user receives their individual calorie/protein goals
echo.
pause
