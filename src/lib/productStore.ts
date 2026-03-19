// 產品下架管理 - 使用環境變量

// 從環境變量讀取下架產品列表
// 格式：DISABLED_PRODUCTS=product-id-1,product-id-2,product-id-3
// 在 Vercel Dashboard > Settings > Environment Variables 中設置

function getDisabledProductsFromEnv(): Set<string> {
  const envValue = process.env.DISABLED_PRODUCTS || '';
  if (!envValue) return new Set();
  
  return new Set(
    envValue.split(',').map(id => id.trim()).filter(id => id.length > 0)
  );
}

// 檢查產品是否下架
export function isProductDisabled(productId: string): boolean {
  return getDisabledProductsFromEnv().has(productId);
}

// 獲取所有下架產品 ID 列表
export function getDisabledProducts(): string[] {
  return Array.from(getDisabledProductsFromEnv());
}

// 這個函數僅用於本地開發時模擬下架狀態
// 生產環境需要通過 Vercel Dashboard 設置環境變量
export function setProductDisabled(productId: string, disabled: boolean) {
  // 注意：運行時無法修改環境變量
  // 需要在 Vercel Dashboard > Settings > Environment Variables 中手動更新
  // 格式：DISABLED_PRODUCTS=id1,id2,id3
  console.log(`[本地開發] 產品 ${productId} 下架狀態: ${disabled}`);
  console.log('[提示] 請在 Vercel Dashboard 環境變量中更新 DISABLED_PRODUCTS');
}

export function clearDisabledProducts() {
  console.log('[提示] 請在 Vercel Dashboard 環境變量中清除 DISABLED_PRODUCTS');
}
