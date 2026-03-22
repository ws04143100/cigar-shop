# 網站數據監控儀表板

## 追蹤指標

### 📊 產品數據
| 指標 | 計算方式 | 正常範圍 |
|------|---------|---------|
| 總產品數 | API /products 返回數量 | > 100 |
| 品牌分布 | 按品牌分類統計 | 10+ 品牌 |
| 庫存緊張 | 庫存 <= 5 的產品數 | < 20% |

### 💰 價格數據
| 指標 | 計算方式 | 監控頻率 |
|------|---------|---------|
| 平均批發價 | wholesalePrice 平均值 | 每次更新 |
| 平均零售價 | retailPrice 平均值 | 每次更新 |
| 價格變動 | 與上次更新對比 | 每次更新 |

### ⚡ 效能數據
| 指標 | 目標值 |
|------|--------|
| API 響應時間 | < 500ms |
| 首頁載入時間 | < 2s |
| 可用率 | > 99% |

### 🔧 系統健康
| 指標 | 檢查方式 |
|------|---------|
| Vercel 部署狀態 | api.vercel.com |
| GitHub 最新提交 | github.com/ws04143100/cigar-shop |
| Excel 檔案更新 | assets/ 最後修改時間 |

## 自動化檢查腳本

參考：`scripts/health-check.ps1`

## 數據來源

- **產品 API**: `https://cigarsshopvip.cc/api/products`
- **Vercel**: https://vercel.com/dashboard
- **GitHub**: https://github.com/ws04143100/cigar-shop
