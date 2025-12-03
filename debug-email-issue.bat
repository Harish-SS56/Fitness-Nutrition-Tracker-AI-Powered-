@echo off
echo 🔍 EMAIL DEBUG - Why No Emails Received?
echo ========================================

echo.
echo 📧 ANALYSIS FROM YOUR IMAGES:
echo   • Gmail shows emails at 8:17 AM and 8:18 AM
echo   • Current time is 9:07 AM
echo   • Settings show "Real email sent successfully"
echo   • But you don't see new emails
echo.
echo 🎯 POSSIBLE CAUSES:
echo   1. Emails going to Spam/Junk folder
echo   2. Emails in Promotions tab (Gmail)
echo   3. Python service not actually sending
echo   4. Gmail delay/filtering
echo   5. Wrong email address
echo.
echo 🧪 DEBUGGING STEPS:
echo.
echo Step 1: Test Python Email Service Directly
echo -----------------------------------------
cd python_email_service

echo Testing direct Python email sending...
python email_service.py send_reminder hk6113367@gmail.com "Harini Debug Test" 1358 180

echo.
echo Step 2: Check if emails are being logged
echo ---------------------------------------
python -c "
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = 'postgresql://neondb_owner:npg_PZae5A9gHpbY@ep-fragrant-violet-ad4xrlr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get recent email logs
    cursor.execute('''
        SELECT email_log_id, recipient_email, email_type, subject, status, sent_at
        FROM email_logs 
        WHERE recipient_email = %s
        ORDER BY sent_at DESC 
        LIMIT 5
    ''', ('hk6113367@gmail.com',))
    
    logs = cursor.fetchall()
    print('Recent email logs for hk6113367@gmail.com:')
    for log in logs:
        print(f'  {log[\"sent_at\"]} - {log[\"subject\"]} - Status: {log[\"status\"]}')
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f'Database error: {e}')
"

cd ..

echo.
echo 🎯 NEXT STEPS TO TRY:
echo   1. Check Gmail Spam folder
echo   2. Check Gmail Promotions tab  
echo   3. Search Gmail for 'Fitness Tracker'
echo   4. Try the new Debug Email button in Settings
echo   5. Check browser console for detailed logs
echo.
echo 🚀 NEW DEBUG FEATURE ADDED:
echo   • Go to Settings tab
echo   • Click "Debug Email (Detailed Logs)" button
echo   • Check browser console (F12) for detailed output
echo   • This will show exactly what's happening
echo.
pause
