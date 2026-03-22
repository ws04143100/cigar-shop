import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { isProductDisabled, getDisabledProducts } from '@/lib/productStore';
import { EXCEL_FILE_NAME } from '@/lib/excelConfig';

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
    const excelPath = path.join(process.cwd(), 'assets', EXCEL_FILE_NAME);
    
    const buffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    const products: Product[] = [];
    const brandStats: Record<string, number> = {};
    
    // 跳�?表头
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 14) continue;
      
      const [
        name,
        category,  // ?��?
        ,  // ?��? - 已移??
        wholesalePrice,
        , , , , , ,  // S, D, C, B, H, ??
        salePrice,   // K??- ?�?�价
        ,  // L??
        stock,  // M??- 库�?
        tag
      ] = row;
      
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
      const disabledProducts = getDisabledProducts();
      filteredProducts = filteredProducts.filter(p => !disabledProducts.includes(p.id));
    }
    
    const disabledProducts = getDisabledProducts();
    
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
