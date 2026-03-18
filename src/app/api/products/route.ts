import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { isProductDisabled, getDisabledProducts } from '@/lib/productStore';

// 产品数据接口
export interface Product {
  id: string;
  name: string;
  category: string;  // 品牌
  wholesalePrice: number;
  retailPrice: number;
  salePrice: number;
  tag: string;
  description: string;
  stock: number;  // 库存
}

// 从本地Excel文件读取数据
function readExcelData(): { products: Product[], brandStats: Record<string, number> } {
  try {
    const fs = require('fs');
    const excelPath = path.join(process.cwd(), 'assets', '20260318批發表.xlsx');
    
    const buffer = fs.readFileSync(excelPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    const products: Product[] = [];
    const brandStats: Record<string, number> = {};
    
    // 跳过表头
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 14) continue;
      
      const [
        name,
        category,  // 品牌
        ,  // 条码 - 已移除
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
      const categoryStr = String(category || '');
      const stockNum = parseInt(String(stock || '0')) || 0;
      
      // 过滤条件：名字带有"散支"或"PCC"的不显示
      if (nameStr.includes('散支') || nameStr.includes('PCC')) continue;
      
      // 只显示雪茄分类
      if (tagStr !== '雪茄') continue;
      
      // 只显示库存 > 1 的产品
      if (stockNum <= 1) continue;
      
      // 统计品牌
      brandStats[categoryStr] = (brandStats[categoryStr] || 0) + 1;
      
      const productId = `product-${products.length + 1}`;
      
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
    console.error('读取Excel文件失败:', error);
    return { products: [], brandStats: {} };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const admin = searchParams.get('admin');  // 管理员模式
    
    const { products, brandStats } = readExcelData();
    
    // 筛选产品
    let filteredProducts = products;
    
    if (brand) {
      filteredProducts = filteredProducts.filter(p => p.category === brand);
    }
    
    // 非管理员模式下，过滤掉下架的产品
    if (admin !== 'true') {
      filteredProducts = filteredProducts.filter(p => !isProductDisabled(p.id));
    }
    
    return NextResponse.json({
      success: true,
      data: filteredProducts,
      total: filteredProducts.length,
      brandStats,
      disabledProducts: admin === 'true' ? getDisabledProducts() : undefined
    });
  } catch (error) {
    console.error('获取产品数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取产品数据失败' },
      { status: 500 }
    );
  }
}
