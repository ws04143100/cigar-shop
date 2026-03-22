// 產品下架管理 - 使用 Vercel KV

import { kv } from '@vercel/kv';

const DISABLED_PRODUCTS_KEY = 'disabled_products';

// 檢查產品是否下架
export function isProductDisabled(productId: string): boolean {
  // 這個需要在異步環境中調用
  return false; // 會在 API 層處理
}

// 異步版本 - 檢查產品是否下架
export async function isProductDisabledAsync(productId: string): Promise<boolean> {
  try {
    const disabledList = await kv.get<string[]>(DISABLED_PRODUCTS_KEY) || [];
    return disabledList.includes(productId);
  } catch (error) {
    console.error('KV 讀取失敗:', error);
    return false;
  }
}

// 異步版本 - 獲取所有下架產品 ID 列表
export async function getDisabledProductsAsync(): Promise<string[]> {
  try {
    return await kv.get<string[]>(DISABLED_PRODUCTS_KEY) || [];
  } catch (error) {
    console.error('KV 讀取失敗:', error);
    return [];
  }
}

// 設置產品下架狀態
export async function setProductDisabled(productId: string, disabled: boolean): Promise<boolean> {
  try {
    const disabledList = await kv.get<string[]>(DISABLED_PRODUCTS_KEY) || [];
    
    let newList: string[];
    if (disabled) {
      // 添加到下架列表（如果不存在）
      if (!disabledList.includes(productId)) {
        newList = [...disabledList, productId];
      } else {
        newList = disabledList;
      }
    } else {
      // 從下架列表移除
      newList = disabledList.filter(id => id !== productId);
    }
    
    await kv.set(DISABLED_PRODUCTS_KEY, newList);
    console.log(`[KV] 產品 ${productId} 下架狀態: ${disabled}, 最新列表:`, newList);
    return true;
  } catch (error) {
    console.error('KV 設置失敗:', error);
    return false;
  }
}

// 清除所有下架產品（用於上傳新 Excel 時）
export async function clearDisabledProducts(): Promise<boolean> {
  try {
    await kv.delete(DISABLED_PRODUCTS_KEY);
    console.log('[KV] 已清除所有下架產品');
    return true;
  } catch (error) {
    console.error('KV 清除失敗:', error);
    return false;
  }
}

// 導出同步版本（兼容舊代碼）
export function getDisabledProducts(): string[] {
  // 同步版本返回空數組，實際異步操作在 API 層處理
  return [];
}
