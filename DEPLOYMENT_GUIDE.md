# 雪茄精品館項目部署指南

## 項目概述

- **項目名稱**: 雪茄精品館 (Premium Cigar Collection)
- **技術棧**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **目標域名**: cigarsshopvip.cc
- **域名購買平台**: Cloudflare

---

## 一、項目結構說明

```
projects/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 首頁（產品列表）
│   │   ├── layout.tsx            # 全局佈局
│   │   ├── share/page.tsx        # 分享頁面（帶二維碼）
│   │   ├── admin/page.tsx        # 管理員後台
│   │   ├── product/[id]/page.tsx # 產品詳情頁
│   │   └── api/                  # API 路由
│   │       ├── products/         # 產品數據 API
│   │       ├── generate-description/  # AI 生成介紹
│   │       ├── admin/            # 管理員 API
│   │       └── refresh/          # 刷新數據
│   ├── components/               # 組件
│   └── lib/                      # 工具函數
├── public/
│   ├── assets/                   # 靜態資源
│   │   └── 20260318批發表.xlsx   # Excel 數據文件
│   ├── manifest.json             # PWA 配置
│   └── bb33...txt                # 微信驗證文件（需更新）
├── package.json
├── vercel.json                   # Vercel 部署配置
├── .env.production               # 生產環境變量
└── next.config.ts
```

---

## 二、部署到 Vercel（推薦方案）

### 步驟 1：準備 GitHub 倉庫

1. 登錄 GitHub，創建新倉庫（如 `cigar-shop`）
2. 在本地項目目錄執行：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用戶名/cigar-shop.git
git push -u origin main
```

### 步驟 2：連接 Vercel

1. 訪問 https://vercel.com
2. 點擊 "Sign Up" → 用 GitHub 登錄
3. 授權 Vercel 訪問你的 GitHub 倉庫
4. 點擊 "Add New Project"
5. 選擇 `cigar-shop` 倉庫
6. 配置：
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `pnpm run build:vercel`
   - Output Directory: `.next`
7. 點擊 "Deploy"

### 步驟 3：添加環境變量

在 Vercel 項目中：
1. 進入 Settings → Environment Variables
2. 添加：
   ```
   NEXT_PUBLIC_SITE_URL = https://cigarsshopvip.cc/home
   ```

### 步驟 4：綁定自定義域名

1. 進入 Settings → Domains
2. 輸入 `cigarsshopvip.cc`，點擊 Add
3. 輸入 `www.cigarsshopvip.cc`，點擊 Add
4. Vercel 會顯示需要配置的 DNS 記錄

---

## 三、Cloudflare DNS 配置

登錄 Cloudflare，進入 `cigarsshopvip.cc` 域名的 DNS 設置：

### 添加以下記錄：

| 類型 | 名稱 | 內容 | 代理狀態 |
|------|------|------|----------|
| CNAME | @ | cname.vercel-dns.com | 已代理（橙色雲） |
| CNAME | www | cname.vercel-dns.com | 已代理（橙色雲） |

### 重要設置：

1. **SSL/TLS 設置**
   - 進入 SSL/TLS → Overview
   - 選擇 **Full (strict)** 模式

2. **始終使用 HTTPS**
   - 進入 SSL/TLS → Edge Certificates
   - 開啟 "Always Use HTTPS"

---

## 四、微信域名驗證（重要！）

部署完成後，需要重新申請微信驗證：

1. 訪問微信公眾平台安全中心
2. 申請解除域名攔截
3. 微信會提供新的驗證文件（如 `xxx.txt`）
4. 將驗證文件放到 `public/` 目錄
5. 重新部署項目
6. 點擊驗證

---

## 五、管理員密碼

- **管理員後台**: https://cigarsshopvip.cc/admin
- **密碼**: `1994`
- **Excel 上傳密碼**: 同上

---

## 六、常用功能說明

### 1. 上傳新的 Excel 批發表
- 在首頁點擊「上傳」按鈕
- 輸入密碼 `1994`
- 選擇新的 Excel 文件

### 2. 產品上下架
- 進入管理員後台
- 點擊產品右側的「下架」按鈕

### 3. 分享鏈接
- https://cigarsshopvip.cc/share - 帶二維碼的分享頁面

### 4. 添加到主屏幕
- 用戶可在手機瀏覽器中將網站添加到主屏幕
- 之後可像 App 一樣快速打開

---

## 七、文件清單（供 OPENCLAW 參考）

### 必須保留的文件：
- `src/` - 全部源碼
- `public/assets/20260318批發表.xlsx` - Excel 數據
- `public/manifest.json` - PWA 配置
- `package.json` - 依賴配置
- `vercel.json` - Vercel 配置
- `.env.production` - 環境變量
- `next.config.ts` - Next.js 配置

### 可能需要更新的：
- `public/bb33...txt` - 微信驗證文件（部署後重新申請）

---

## 八、聯繫信息

如有問題，請檢查：
1. Vercel 部署日誌
2. Cloudflare DNS 狀態
3. 微信域名驗證狀態

---

**祝部署順利！**
