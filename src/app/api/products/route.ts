import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { isProductDisabled, getDisabledProducts } from '@/lib/productStore';
import { getLatestExcelFileName } from '@/lib/excelConfig';

// 产�??�据?�口
export interface Product {
  id: string;
  name: string;
  category: string;  // ?��?
  wholesalePrice: number;
  retailPrice: number;
  salePrice: number;
  tag: string;
  description: string;
  stock: number;  // 库�?
}

// 生成稳定的产�? ID，使用 rowIndex 确保唯一性
function generateProductId(name: string, category: string, rowIndex: number): string {
  // 使用 product- 前缀 + rowIndex + 名字和分类的 hash
  const key = `${name}-${category}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // 使用 rowIndex 确保唯一性
  return `product-${rowIndex}-${Math.abs(hash).toString(36)}`;
}

// 从本?�Excel?�件读�??�据
function readExcelData(): { products: Product[], brandStats: Record<string, number> } {
  try {
    const fs = require('fs');
    const excelFileName = getLatestExcelFileName();
    const excelPath = path.join(process.cwd(), 'assets', excelFileName);
    
    const buffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    console.log('[Excel] Total rows:', data.length);
    if (data.length > 0) console.log('[Excel] Header row:', JSON.stringify(data[0]));
    if (data.length > 1) console.log('[Excel] Row 1:', JSON.stringify(data[1]));
    if (data.length > 2) console.log('[Excel] Row 2:', JSON.stringify(data[2]));
    
    const products: Product[] = [];
    const brandStats: Record<string, number> = {};
    
    // 跳�?表头
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 14) continue;
      
      // Detect file format: new files have 15 columns (with 进货价 at index 10)
      const has进货价 = row.length >= 15;
      
      let name: any, category: any, wholesalePrice: any, salePrice: any, stock: any, tag: any;
      if (has进货价) {
        // New format: 15 cols - 进货价 at index 10 shifts everything after it by +1
        [
          name,
          category,
          ,  // 条码
          wholesalePrice,  // index 3 - 批发价
          , , , , , ,  // S, D, C, B, H, 倉 (indices 4-9)
          ,  // 进货价 (index 10) - skip
          salePrice,  // index 11 - 销售价
          ,  // 零下 (index 12)
          stock,  // index 13 - 库存总和
          tag      // index 14 - 标签
        ] = row;
      } else {
        // Old format: 14 cols - no 进货价 column
        [
          name,
          category,
          ,  // 条码
          wholesalePrice,  // index 3 - 批发价
          , , , , , ,  // S, D, C, B, H, 倉 (indices 4-9)
          salePrice,  // index 10 - 销售价
          ,  // 零下 (index 11)
          stock,  // index 12 - 库存总和
          tag      // index 13 - 标签
        ] = row;
      }
      
      if (!name || name === '---' || !tag || tag === '---') continue;
      
      const nameStr = String(name || '');
      const tagStr = String(tag || '');
      const categoryStr = String(category || '');
      const stockNum = parseInt(String(stock || '0')) || 0;
      
      // 过滤?�件：�?字带????��"??PCC"?��??�示
      if (nameStr.includes('散支') || nameStr.includes('PCC')) continue;
      
      // ?�显示雪?��?�?
      if (tagStr !== '雪茄') continue;
      
      // ?�显示�?�?> 1 ?�产??
      if (stockNum <= 1) continue;
      
      // 统计?��?
      brandStats[categoryStr] = (brandStats[categoryStr] || 0) + 1;
      
      // 使用稳定的 ID 生成方式
      const productId = generateProductId(nameStr, categoryStr, i);
      
      products.push({
        id: productId,
        name: nameStr,
        category: categoryStr,
        wholesalePrice: parseFloat(wholesalePrice) || 0,
        retailPrice: parseFloat(salePrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        tag: tagStr,
        description: '',
        stock: stockNum
      });
    }
    
    return { products, brandStats };
  } catch (error) {
    console.error('读�?Excel?�件失败:', error);
    return { products: [], brandStats: {} };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const admin = searchParams.get('admin');  // 管�??�模�?
    
    const { products, brandStats } = readExcelData();
    
    // 篩選產品
    let filteredProducts = products;
    
    if (brand) {
      filteredProducts = filteredProducts.filter(p => p.category === brand);
    }
    
    // 非管理員模式下過濾下架產品
    if (admin !== 'true') {
      const disabledProducts = await getDisabledProducts();
      filteredProducts = filteredProducts.filter(p => !disabledProducts.includes(p.id));
    }
    
    const disabledProducts = await getDisabledProducts();
    
    return NextResponse.json({
      success: true,
      data: filteredProducts,
      total: filteredProducts.length,
      brandStats,
      disabledProducts: admin === 'true' ? disabledProducts : undefined
    });
  } catch (error) {
    console.error('?��?产�??�据失败:', error);
    return NextResponse.json(
      { success: false, error: '?��?产�??�据失败' },
      { status: 500 }
    );
  }
}
