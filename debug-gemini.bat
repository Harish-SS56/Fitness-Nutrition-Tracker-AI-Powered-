@echo off
echo 🔍 DEBUGGING GEMINI 1.5 FLASH
echo ==============================

echo.
echo ✅ Fixed to use: gemini-1.5-flash (no latest)
echo ✅ API Key: AIzaSyDIiVwTiWeUch9xL_7oKDHKhmp_kweiTYs

echo.
echo 🚀 Starting server...
echo.
echo 📋 DEBUGGING STEPS:
echo.
echo 1. First test API directly:
echo    → http://localhost:3000/api/test-gemini
echo.
echo 2. Check what error you get:
echo    → 404 = Wrong model name
echo    → 403 = API key issue  
echo    → 400 = Request format issue
echo.
echo 3. Then test AI Chat:
echo    → Dashboard → AI Assistant
echo    → Type "hello"
echo.
echo 4. Check browser console (F12):
echo    → Look for [Gemini] and [AI Chat] logs
echo    → Copy any error messages
echo.
echo 🌐 Opening test page...

start http://localhost:3000/api/test-gemini
timeout /t 2 >nul
start http://localhost:3000

call pnpm dev

pause
