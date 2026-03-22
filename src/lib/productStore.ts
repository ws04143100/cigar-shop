// 產品下架管理 - 使用 JSON 文件
// 儲存位置：data/disabled-products.json
// 每次更新會觸發 Vercel Deploy Hook → 部署

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DISABLED_FILE = path.join(DATA_DIR, 'disabled-products.json');
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK;

// 確保 data 目錄存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // 創建初始文件
    fs.writeFileSync(DISABLED_FILE, JSON.stringify({ products: [], updatedAt: new Date().toISOString() }, null, 2));
  }
}

// 讀取下架產品列表
function readDisabledProducts(): string[] {
  ensureDataDir();
  
  try {
    const content = fs.readFileSync(DISABLED_FILE, 'utf-8');
    const data = JSON.parse(content);
    return data.products || [];
  } catch (error) {
    console.error('讀取下架列表失敗:', error);
    return [];
  }
}

// 寫入下架產品列表
function writeDisabledProducts(products: string[]): void {
  ensureDataDir();
  
  const data = {
    products,
    updatedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(DISABLED_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('[JSON] 已更新下架列表:', products);
}

// 觸發 Vercel 部署
async function triggerDeployment(): Promise<boolean> {
  if (!VERCEL_DEPLOY_HOOK) {
    console.log('[JSON] 無 VERCEL_DEPLOY_HOOK，跳過部署觸發');
    return false;
  }
  
  try {
    const response = await fetch(VERCEL_DEPLOY_HOOK, {
      method: 'POST'
    });
    
    if (response.ok) {
      console.log('[JSON] 已觸發 Vercel 部署');
      return true;
    } else {
      console.error('[JSON] Vercel 部署觸發失敗:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[JSON] Vercel 部署觸發錯誤:', error);
    return false;
  }
}

// 檢查產品是否下架（同步版本）
export function isProductDisabled(productId: string): boolean {
  const disabledList = readDisabledProducts();
  return disabledList.includes(productId);
}

// 獲取所有下架產品（同步版本）
export function getDisabledProducts(): string[] {
  return readDisabledProducts();
}

// 設置產品下架狀態
export async function setProductDisabled(productId: string, disabled: boolean): Promise<boolean> {
  try {
    const disabledList = readDisabledProducts();
    
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
    
    writeDisabledProducts(newList);
    console.log(`[JSON] 產品 ${productId} 下架狀態: ${disabled}`);
    
    // 觸發 Vercel 部署
    const deployed = await triggerDeployment();
    if (deployed) {
      console.log('[JSON] Vercel 部署中，請稍候...');
    }
    
    return true;
  } catch (error) {
    console.error('設置下架狀態失敗:', error);
    return false;
  }
}

// 清除所有下架產品（用於上傳新 Excel 時）
export async function clearDisabledProducts(): Promise<boolean> {
  try {
    writeDisabledProducts([]);
    console.log('[JSON] 已清除所有下架產品');
    
    await triggerDeployment();
    
    return true;
  } catch (error) {
    console.error('清除下架列表失敗:', error);
    return false;
  }
}
