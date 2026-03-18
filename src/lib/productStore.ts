import * as fs from 'fs';
import * as path from 'path';

const DISABLED_FILE = path.join(process.cwd(), 'data', 'disabled-products.json');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DISABLED_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取下架列表
function readDisabledProducts(): Set<string> {
  try {
    ensureDataDir();
    if (fs.existsSync(DISABLED_FILE)) {
      const data = fs.readFileSync(DISABLED_FILE, 'utf-8');
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    console.error('读取下架列表失败:', error);
  }
  return new Set();
}

// 写入下架列表
function writeDisabledProducts(disabledSet: Set<string>) {
  try {
    ensureDataDir();
    fs.writeFileSync(DISABLED_FILE, JSON.stringify(Array.from(disabledSet), null, 2));
  } catch (error) {
    console.error('写入下架列表失败:', error);
  }
}

// 获取下架列表
export function getDisabledProducts(): string[] {
  return Array.from(readDisabledProducts());
}

// 设置下架状态
export function setProductDisabled(productId: string, disabled: boolean) {
  const disabledSet = readDisabledProducts();
  if (disabled) {
    disabledSet.add(productId);
  } else {
    disabledSet.delete(productId);
  }
  writeDisabledProducts(disabledSet);
}

// 检查产品是否下架
export function isProductDisabled(productId: string): boolean {
  return readDisabledProducts().has(productId);
}

// 清空下架列表（刷新时调用）
export function clearDisabledProducts() {
  writeDisabledProducts(new Set());
}
