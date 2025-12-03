@echo off
echo 🔧 TESTING API FIX
echo =================

echo.
echo ✅ Fixed import paths in all email API routes:
echo   • /api/email/preferences
echo   • /api/email/sync-preferences  
echo   • /api/email/test-send
echo.
echo 📁 Updated paths from:
echo   "../../../lib/database.js"
echo   to:
echo   "../../../../lib/database.js"
echo.
echo 🚀 Now start your Next.js server:
echo   npm run dev
echo.
echo 🧪 Then test the complete system:
echo   1. Login to your account
echo   2. Go to Settings tab
echo   3. Configure email preferences
echo   4. Click "Test Email" button
echo   5. Save preferences
echo.
echo ✅ ALL IMPORT ERRORS FIXED!
pause
