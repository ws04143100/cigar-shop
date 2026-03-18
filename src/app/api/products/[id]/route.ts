import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { isProductDisabled } from '@/lib/productStore';

interface Product {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  salePrice: number;
  tag: string;
  description: string;
  stock: number;
}

// 生成稳定的产�? ID
function generateProductId(name: string, category: string): string {
  const key = `${name}-${category}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key.length > 20) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `product-${Math.abs(hash).toString(36)}`;
  }
  return `product-${key}`;
}

function readExcelData(): Product[] {
  try {
    const fs = require('fs');
    const excelPath = path.join(process.cwd(), 'assets', '20260318批發表.xlsx');
    
    const buffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    const products: Product[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 14) continue;
      
      const [
        name,
        category,
        ,  // 條碼 - 已移除
        wholesalePrice,
        , , , , , ,  // S, D, C, B, H, 倉
        salePrice,   // K列 - 销售价
        ,  // L列
        stock,  // M列 - 库存
        tag
      ] = row;
      
      if (!name || name === '---' || !tag || tag === '---') continue;
      
      const nameStr = String(name || '');
      const tagStr = String(tag || '');
      
      if (nameStr.includes('散支') || nameStr.includes('PCC')) continue;
      if (tagStr !== '雪茄') continue;
      
      // 使用稳定的 ID 生成方式
      const productId = generateProductId(nameStr, String(category || ''));
      
      products.push({
        id: productId,
        name: nameStr,
        category: String(category || ''),
        wholesalePrice: parseFloat(wholesalePrice) || 0,
        retailPrice: parseFloat(salePrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        tag: tagStr,
        description: '',
        stock: parseInt(String(stock || '0')) || 0
      });
    }
    
    return products;
  } catch (error) {
    console.error('读取Excel文件失败:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin');
    
    const products = readExcelData();
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: '產品未找到' },
        { status: 404 }
      );
    }
    
    // 检查是否下架
    const disabled = isProductDisabled(id);
    
    return NextResponse.json({
      success: true,
      data: product,
      isDisabled: disabled
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    return NextResponse.json(
      { success: false, error: '獲取產品詳情失敗' },
      { status: 500 }
    );
  }
}
