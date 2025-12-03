@echo off
echo 🔧 FIXING AI NUTRITION ASSISTANT
echo =================================

echo.
echo 🔍 Diagnosing the issue...

echo.
echo 1. Testing Gemini API key...
echo Visit: http://localhost:3000/api/test-gemini
echo This will test if your API key works

echo.
echo 2. Changes made:
echo ✅ Fixed API endpoint (removed 'latest' suffix)
echo ✅ Added fallback responses (no more 500 errors)
echo ✅ Enhanced error logging
echo ✅ Graceful error handling

echo.
echo 3. Starting the app...
start http://localhost:3000
start http://localhost:3000/api/test-gemini

echo.
echo 📋 TESTING STEPS:
echo.
echo Step 1: Check API Key
echo   → Open: http://localhost:3000/api/test-gemini
echo   → Should show: "Gemini API is working!"
echo.
echo Step 2: Test AI Chat
echo   → Go to Dashboard → AI Assistant tab
echo   → Type: "Hello"
echo   → Should get a response (even if fallback)
echo.
echo Step 3: Check Console
echo   → Press F12 → Console tab
echo   → Look for [AI Chat] and [Gemini] logs
echo.
echo 🚀 If API test fails, the API key might need updating
echo 💡 If chat works with fallback, API key issue confirmed
echo.

call pnpm dev

pause
