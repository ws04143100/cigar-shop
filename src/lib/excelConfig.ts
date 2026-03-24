// Excel 配置文件 - 統一管理數據源

// 當前使用的 Excel 文件名
// 更新庫存數據時，只需覆蓋此文件並確保檔名一致
export const EXCEL_FILE_NAME = '20260320批發表.xlsx';

// 動態取得最新日期的批發表檔案
export function getLatestExcelFileName(): string {
  try {
    const fs = require('fs');
    const path = require('path');
    const assetsDir = path.join(process.cwd(), 'assets');
    
    const files = fs.readdirSync(assetsDir);
    const wholesaleFiles = files.filter((f: string) => 
      /^\d{8}批發表\.xlsx$/i.test(f)
    );
    
    if (wholesaleFiles.length === 0) {
      console.warn('[ExcelConfig] 找不到批發表文件，使用默認:', EXCEL_FILE_NAME);
      return EXCEL_FILE_NAME;
    }
    
    // 按日期排序，取最新的
    wholesaleFiles.sort((a: string, b: string) => b.localeCompare(a));
    const latestFile = wholesaleFiles[0];
    console.log('[ExcelConfig] 找到最新批發表:', latestFile);
    return latestFile;
  } catch (error) {
    console.error('[ExcelConfig] 獲取最新檔案失敗:', error);
    return EXCEL_FILE_NAME;
  }
}
