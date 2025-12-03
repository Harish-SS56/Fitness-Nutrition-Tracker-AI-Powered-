@echo off
echo 🔍 Diagnosing AI Chat Issues
echo ============================

echo.
echo 📋 Checking AI Chat components...

echo.
echo 1. Checking if AI Chat API endpoint exists...
if exist "app\api\ai\chat\route.js" (
    echo ✅ AI Chat API endpoint exists
) else (
    echo ❌ AI Chat API endpoint missing
)

echo.
echo 2. Checking if Gemini client exists...
if exist "lib\gemini-client.js" (
    echo ✅ Gemini client exists
) else (
    echo ❌ Gemini client missing
)

echo.
echo 3. Checking if AI Chat component exists...
if exist "components\ai-chat.tsx" (
    echo ✅ AI Chat component exists
) else (
    echo ❌ AI Chat component missing
)

echo.
echo 4. Testing Gemini API key format...
findstr "AIzaSy" lib\gemini-client.js >nul
if %errorlevel%==0 (
    echo ✅ API key format looks correct
) else (
    echo ❌ API key format issue
)

echo.
echo 🚀 Starting the app to test AI Chat...
echo.
echo 📋 To test AI Chat:
echo   1. Go to Dashboard → AI Assistant tab
echo   2. Type a message like "What should I eat for breakfast?"
echo   3. Check browser console (F12) for any errors
echo   4. If you see errors, report them back
echo.
echo 🌐 Opening http://localhost:3000...
start http://localhost:3000
call pnpm dev

pause
