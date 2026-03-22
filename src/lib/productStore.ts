// 產品下架管理 - 使用 Vercel Redis (KV)
// 儲存位置：Redis 數據庫

import { createClient } from 'redis';

const REDIS_KEY = 'disabled_products';

// 創建 Redis 客戶端（延遲初始化）
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => console.error('Redis 錯誤:', err));
    
    await redisClient.connect();
  }
  return redisClient;
}

// 檢查產品是否下架
export async function isProductDisabled(productId: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const disabledList = await client.get(REDIS_KEY);
    const products = disabledList ? JSON.parse(disabledList) : [];
    return products.includes(productId);
  } catch (error) {
    console.error('Redis 讀取失敗:', error);
    return false;
  }
}

// 獲取所有下架產品
export async function getDisabledProducts(): Promise<string[]> {
  try {
    const client = await getRedisClient();
    const disabledList = await client.get(REDIS_KEY);
    return disabledList ? JSON.parse(disabledList) : [];
  } catch (error) {
    console.error('Redis 讀取失敗:', error);
    return [];
  }
}

// 設置產品下架狀態
export async function setProductDisabled(productId: string, disabled: boolean): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const disabledListStr = await client.get(REDIS_KEY);
    const disabledList: string[] = disabledListStr ? JSON.parse(disabledListStr) : [];
    
    let newList: string[];
    if (disabled) {
      if (!disabledList.includes(productId)) {
        newList = [...disabledList, productId];
      } else {
        newList = disabledList;
      }
    } else {
      newList = disabledList.filter(id => id !== productId);
    }
    
    await client.set(REDIS_KEY, JSON.stringify(newList));
    console.log(`[Redis] 產品 ${productId} 下架狀態: ${disabled}, 最新列表:`, newList);
    return true;
  } catch (error) {
    console.error('Redis 設置失敗:', error);
    return false;
  }
}

// 清除所有下架產品
export async function clearDisabledProducts(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.set(REDIS_KEY, JSON.stringify([]));
    console.log('[Redis] 已清除所有下架產品');
    return true;
  } catch (error) {
    console.error('Redis 清除失敗:', error);
    return false;
  }
}
