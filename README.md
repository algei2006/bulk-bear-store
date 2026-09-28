# 🐻 批發熊 Bulk Bear - 網上批發商城

一個完整嘅網上批發商城系統，包括前台購物、後台管理、送貨服務、結賬系統、推薦獎賞機制，以及 PWA 手機 App。

## ✨ 功能特色

### 買家前台
- ✅ 產品瀏覽（分類、搜尋、排序、分頁）
- ✅ 階梯式批發價顯示（10件、50件、100件等不同價位）
- ✅ 購物車（自動套用最佳階梯價）
- ✅ 優惠碼系統（百分比、固定金額、最低消費限制）
- ✅ 結賬流程（地址、運送方式、付款方式）
- ✅ 會員系統（註冊、登入、忘記密碼）
- ✅ 訂單查詢、地址簿、個人資料
- ✅ 推薦獎賞系統（每個推薦朋友賺 5% 回贈）
- ✅ 響應式設計（手機、平板、桌面）

### 管理後台
- ✅ 訂單管理（狀態更新、運單號）
- ✅ 產品管理（CRUD、階梯價格設定、上下架）
- ✅ 分類管理
- ✅ 優惠碼管理（百分比、固定金額、使用限制）
- ✅ 送貨區域管理（地區、運費、免運門檻）
- ✅ 會員管理（消費統計、訂單數）

### 技術特色
- ✅ PWA 手機 App（iOS/Android 通用）
- ✅ Service Worker 離線支援
- ✅ SQL 注入防護（prepared statements）
- ✅ Session-based 認證
- ✅ 密碼 bcrypt 加密
- ✅ Helmet 安全標頭
- ✅ Rate limiting

---

## 🚀 快速開始

### 環境要求
- Node.js 18+
- npm 或 pnpm

### 安裝步驟

```bash
# 1. 進入項目目錄
cd bulk-bear-store

# 2. 安裝依賴
npm install

# 3. 初始化數據庫（建立表 + 種子數據）
npm run seed

# 4. 啟動服務器
npm start
```

打開瀏覽器：
- **前台**：http://localhost:3000
- **後台**：http://localhost:3000/admin/login

### 預設帳號

| 角色 | 電郵 | 密碼 |
|------|------|------|
| 管理員 | admin@bulk-bear.com | BulkBear2024! |
| 客戶 | demo@bulk-bear.com | demo1234 |
| 客戶 | alice@example.com | demo1234 |

---

## 📁 項目結構

```
bulk-bear-store/
├── server.js                # 主服務器
├── package.json
├── .env                     # 環境配置
├── db/
│   └── database.js          # 數據庫初始化 + Schema
├── middleware/
│   ├── auth.js              # 認證中間件
│   └── pricing.js           # 階梯價格計算
├── routes/
│   ├── shop.js              # 公開頁面
│   ├── cart.js              # 購物車
│   ├── checkout.js          # 結賬
│   ├── auth.js              # 登入註冊
│   ├── user.js              # 用戶中心
│   ├── admin.js             # 後台管理
│   └── api.js               # JSON API
├── views/
│   ├── partials/            # 共用模板（header, footer）
│   ├── shop/                # 前台頁面
│   ├── cart/                # 購物車
│   ├── checkout/            # 結賬
│   ├── auth/                # 登入註冊
│   ├── user/                # 用戶中心
│   ├── admin/               # 後台
│   └── error.ejs
├── public/
│   ├── css/style.css        # 全站樣式
│   ├── js/app.js            # 互動 JS
│   ├── images/logo.jpg      # Logo
│   ├── icons/               # PWA 圖標
│   ├── manifest.json        # PWA 配置
│   └── sw.js                # Service Worker
└── scripts/
    ├── seed.js              # 種子數據
    └── reset-db.js          # 重置數據庫
```

---

## 🌐 部署上線教學

### 方案 A：Render（推薦，免費）

1. **註冊 Render**：https://render.com
2. **準備 Git Repo**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. **推到 GitHub**：建立 repo，push 代碼
4. **Render 設定**：
   - 點 `New +` → `Web Service`
   - 連接 GitHub repo
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Instance Type**：Free
   - 環境變數：
     ```
     NODE_ENV=production
     SESSION_SECRET=<隨機長字符串>
     ADMIN_EMAIL=admin@bulk-bear.com
     ADMIN_PASSWORD=<你的強密碼>
     ```
5. **部署完成**：Render 會提供 `xxx.onrender.com` 網址

### 方案 B：Railway（簡單）

1. 註冊 https://railway.app
2. 點 `New Project` → `Deploy from GitHub`
3. 選擇 repo
4. 設定環境變數（同上）
5. Railway 自動部署，提供網址

### 方案 C：自己的 VPS（完全控制）

```bash
# 1. SSH 到你的服務器
ssh user@your-server-ip

# 2. 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone 代碼
git clone <your-repo-url> bulk-bear
cd bulk-bear

# 4. 安裝 + 初始化
npm install --production
npm run seed

# 5. 用 PM2 保持運行
sudo npm install -g pm2
pm2 start server.js --name bulk-bear
pm2 startup
pm2 save

# 6. 設定 Nginx 反向代理
sudo nano /etc/nginx/sites-available/bulk-bear
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bulk-bear /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. 啟用 HTTPS (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📱 手機 App 設定（PWA）

呢個系統已經內置 PWA 支援，**唔需要上架 App Store 就可以安裝到手機**。

### iPhone (iOS 16.4+)

1. 用 Safari 開網站（例：https://your-site.com）
2. 點底部「分享」按鈕 ⬆️
3. 選擇「加入主畫面」
4. 確認名稱「批發熊」
5. 完成！App 圖示會出現喺主畫面

**注意：** PWA 必須用 HTTPS。iOS 用戶必須用 Safari 開。

### Android (Chrome)

1. 用 Chrome 開網站
2. 右上角選單 → 「加到主畫面」或「安裝應用程式」
3. 確認安裝
4. 完成！可以從主畫面、應用程式列表開啟

### PWA 設定驗證

打開 Chrome DevTools → Application 標籤：
- ✅ Manifest 載入成功
- ✅ Service Worker 已註冊
- ✅ 可以離線瀏覽快取嘅頁面

---

## 🍎 真嘅 iOS / Android App 上架教學

如果你想真正上架 App Store / Play Store（而唔係 PWA）：

### 方案 1：使用 PWA Builder（最快）

1. 去 https://www.pwabuilder.com
2. 輸入你嘅網站 URL
3. 點「Package For Stores」
4. 選擇 iOS / Android
5. 下載 `.ipa` (iOS) 或 `.apk` / `.aab` (Android)
6. **iOS**：需要 Apple Developer 帳號（$99 USD/年）用 Xcode 上傳
7. **Android**：用 Google Play Console（一次性 $25 USD）上傳 `.aab`

### 方案 2：用 Capacitor 包裝（推薦）

```bash
# 安裝 Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init "批發熊" "com.bulkbear.app" --web-dir=public

# 加入 iOS / Android 平台
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# 同步 + 開原生 IDE
npx cap sync
npx cap open ios      # 需要 macOS + Xcode
npx cap open android  # 需要 Android Studio
```

### 方案 3：React Native / Flutter（完整原生）

如果要 100% 原生體驗，要重新用 React Native 或 Flutter 開發。預計額外需 2-4 星期。

---

## 💳 付款系統整合

### Stripe 信用卡（推薦）

1. 註冊 https://stripe.com
2. 取得 API Keys（`sk_test_...` 同 `pk_test_...`）
3. 加到 `.env`：
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_PUBLIC_KEY=pk_test_xxx
   ```
4. 安裝 Stripe SDK：
   ```bash
   npm install stripe
   ```
5. 修改 `routes/checkout.js` 嘅 `/pay/:id` route，加入 Stripe Checkout Session

完整範例：
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/pay/:id', async (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'hkd',
        product_data: { name: `Order ${order.order_no}` },
        unit_amount: order.total * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/checkout/success/${order.id}`,
    cancel_url: `${req.protocol}://${req.get('host')}/cart`,
  });
  res.redirect(303, session.url);
});
```

### 其他付款方式
- **PayPal**：安裝 `paypal-rest-sdk`
- **PayMe / FPS**：手動產生 QR Code，確認後更新訂單狀態
- **銀行轉帳**：已預設（`payment_method = 'bank'`）

---

## 🎯 推薦獎賞機制

系統已內置完整推薦系統：

1. **每個用戶有專屬推薦碼**（8位字符）
2. **分享連結**：`https://your-site.com/ref/{CODE}`
3. **被推薦人註冊時**輸入推薦碼（自動偵測 URL 參數）
4. **被推薦人首次落單**：推薦人賺訂單金額 5%
5. **獎賞記錄**：用戶中心 `/user/referral` 可查看

修改回贈比率：編輯 `routes/checkout.js` 第 137 行：
```javascript
const reward = calc.subtotal * 0.05; // 改為你想要的比率
```

---

## 🛠️ 維護與備份

### 數據庫備份

```bash
# 備份
cp db/bulk-bear.db backups/bulk-bear-$(date +%Y%m%d).db

# 還原
cp backups/bulk-bear-20260101.db db/bulk-bear.db
```

### 日誌查看

```bash
# PM2 日誌
pm2 logs bulk-bear

# 實時監控
pm2 monit
```

### 性能優化

- 加 Redis 做 session store
- Cloudflare CDN 快取靜態資源
- 圖片用 WebP 格式
- 數據庫改用 PostgreSQL（支援更高併發）

---

## 📞 常見問題

**Q: 忘記管理員密碼點算？**
```bash
npm run reset  # 重置數據庫
npm run seed   # 重新建立預設管理員
```

**Q: 點樣加新分類？**
後台 → 分類管理 → 新增分類

**Q: 點樣改 Logo？**
替換 `public/images/logo.jpg` 同重新生成 `public/icons/`（用 PIL 嘅 icon 腳本）

**Q: 支援邊啲貨幣？**
預設 HK$，可改 `.env` 嘅 `STORE_CURRENCY` 同 `STORE_CURRENCY_SYMBOL`

**Q: 點樣發郵件通知？**
安裝 `nodemailer`，喺 `routes/checkout.js` 落單成功後加：
```javascript
const nodemailer = require('nodemailer');
// ... send confirmation email
```

---

## 📄 License

MIT License - 你可以自由使用、修改、分發

---

## 🙋 支援

有問題？可以：
1. 查 [Express.js 文檔](https://expressjs.com)
2. 查 [better-sqlite3 文檔](https://github.com/WiseLibs/better-sqlite3)
3. PWA 支援：https://web.dev/progressive-web-apps/

---

**🐻 批發熊 Bulk Bear - 祝你生意興隆！**