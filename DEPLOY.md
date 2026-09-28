# Render.com 一鍵部署

這個專案已經預先配置好喺 Render 部署。跟住以下 5 步驟就搞掂：

## 1. 註冊帳號
- 去 https://github.com 註冊（如果未有）
- 去 https://render.com 用 GitHub 登入

## 2. 創建 GitHub 倉庫
- New repository
- 名稱：`bulk-bear-store`
- 揀 Public
- 創建後，上載呢個 ZIP 入面所有檔案（唔好包 ZIP 本身）

或者用 git command：
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/bulk-bear-store.git
git push -u origin main
```

## 3. Render 創建服務
- New + → Web Service
- 揀你嘅 repo
- 設定：
  - Name: bulk-bear-store
  - Region: Singapore
  - Branch: main
  - Build: `npm install`
  - Start: `npm start`
  - Instance: Free
- Advanced 加入環境變數：
  - `NODE_VERSION` = `20.11.0`
  - `SESSION_SECRET` = 任何 32 個字（例如：`mySuperSecretKeyForSessionsAbc1234567`）
  - `ADMIN_EMAIL` = 你嘅 email
  - `ADMIN_PASSWORD` = 你嘅密碼

## 4. 等 5 分鐘
Render 會自動 build + deploy。當狀態變 `Live` 就搞掂！

## 5. 訪問
你嘅網站：`https://bulk-bear-store.onrender.com`

管理員：`https://bulk-bear-store.onrender.com/admin/login`

帳號：admin@bulk-bear.com
密碼：BulkBear2024!

第一次登入後請立即改密碼！
