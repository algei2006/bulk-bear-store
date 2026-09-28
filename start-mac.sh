#!/bin/bash

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║      🐻  批發熊網店 - 本地啟動 (Mac/Linux)      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ 未安裝 Node.js"
    echo ""
    echo "請先用 Homebrew 安裝："
    echo "  brew install node"
    echo ""
    echo "或者去 https://nodejs.org 下載安裝"
    echo ""
    exit 1
fi

echo "✅ 偵測到 Node.js"
node --version
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 第一次執行，正在安裝套件（約 1-2 分鐘）..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 套件安裝失敗"
        exit 1
    fi
fi

# Check if database exists
if [ ! -f "db/store.db" ]; then
    echo "🌱 第一次執行，正在初始化資料庫..."
    echo ""
    npm run seed
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 資料庫初始化失敗"
        exit 1
    fi
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║    🚀  啟動伺服器中...                          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "網店網址：http://localhost:3000"
echo "管理後台：http://localhost:3000/admin/login"
echo ""
echo "  管理員帳號：admin@bulk-bear.com"
echo "  管理員密碼：BulkBear2024!"
echo ""
echo "提示：按 Ctrl+C 可以停止伺服器"
echo ""

# Open browser after 3 seconds
(sleep 3 && open "http://localhost:3000") &

# Start server
npm start
