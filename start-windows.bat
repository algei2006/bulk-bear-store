@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║      🐻  批發熊網店 - 本地啟動 (Windows)        ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未安裝 Node.js
    echo.
    echo 請先去 https://nodejs.org 下載並安裝 LTS 版本
    echo 下載後重新執行呢個檔案
    echo.
    pause
    exit /b 1
)

echo ✅ 偵測到 Node.js
node --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 第一次執行，正在安裝套件（約 1-2 分鐘）...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 套件安裝失敗
        pause
        exit /b 1
    )
)

REM Check if database exists
if not exist "db\store.db" (
    echo 🌱 第一次執行，正在初始化資料庫...
    echo.
    call npm run seed
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 資料庫初始化失敗
        pause
        exit /b 1
    )
)

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║    🚀  啟動伺服器中...                          ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo 網店網址：http://localhost:3000
echo 管理後台：http://localhost:3000/admin/login
echo.
echo   管理員帳號：admin@bulk-bear.com
echo   管理員密碼：BulkBear2024!
echo.
echo 提示：按 Ctrl+C 可以停止伺服器
echo.

REM Wait 3 seconds then open browser
start "" http://localhost:3000

REM Start server
call npm start
