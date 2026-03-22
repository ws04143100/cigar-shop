// 產品下架管理 - 使用 JSON 文件
// 儲存位置：data/disabled-products.json
// 每次更新會觸發 GitHub commit → Vercel 部署

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DISABLED_FILE = path.join(DATA_DIR, 'disabled-products.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'ws04143100';
const REPO_NAME = 'cigar-shop';
const FILE_PATH = 'data/disabled-products.json';

// 確保 data 目錄存在
function ensureDataDir() {
  if (!fs.existsSync(DISABLED_FILE)) {
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

// 提交到 GitHub
async function commitToGitHub(products: string[]): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    console.log('[JSON] 無 GITHUB_TOKEN，跳過自動提交');
    return false;
  }
  
  try {
    const content = fs.readFileSync(DISABLED_FILE, 'utf-8');
    const base64Content = Buffer.from(content).toString('base64');
    
    // 獲取當前文件的 SHA
    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    let sha = '';
    if (getResponse.ok) {
      const getData = await getResponse.json();
      sha = getData.sha;
    }
    
    // 提交更新
    const commitMessage = `Update disabled products: ${products.join(', ') || 'none'}`;
    const putUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        sha: sha
      })
    });
    
    if (putResponse.ok) {
      console.log('[JSON] 已提交到 GitHub');
      return true;
    } else {
      console.error('[JSON] GitHub 提交失敗:', await putResponse.text());
      return false;
    }
  } catch (error) {
    console.error('[JSON] GitHub 提交錯誤:', error);
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
    
    // 提交到 GitHub
    const committed = await commitToGitHub(newList);
    if (committed) {
      console.log('[JSON] Vercel 將自動部署...');
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
    
    await commitToGitHub([]);
    
    return true;
  } catch (error) {
    console.error('清除下架列表失敗:', error);
    return false;
  }
}
