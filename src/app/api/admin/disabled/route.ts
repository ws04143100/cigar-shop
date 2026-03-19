import { NextRequest, NextResponse } from 'next/server';

// 獲取下架產品列表
export async function GET() {
  const disabledProducts = process.env.DISABLED_PRODUCTS?.split(',').filter(Boolean) || [];
  
  return NextResponse.json({
    success: true,
    disabledProducts
  });
}
