import { NextRequest, NextResponse } from 'next/server';
import { getDisabledProducts, clearDisabledProducts } from '@/lib/productStore';

// 獲取下架產品列表
export async function GET() {
  const disabledProducts = await getDisabledProducts();
  
  return NextResponse.json({
    success: true,
    disabledProducts
  });
}

// 清除所有下架產品
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (password !== '1994') {
      return NextResponse.json(
        { success: false, error: '密碼錯誤' },
        { status: 401 }
      );
    }
    
    await clearDisabledProducts();
    
    return NextResponse.json({
      success: true,
      message: '已清除所有下架產品，Vercel 部署中...'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '操作失敗' },
      { status: 500 }
    );
  }
}
