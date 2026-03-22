import { NextRequest, NextResponse } from 'next/server';
import { clearDisabledProducts } from '@/lib/productStore';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (password !== '1994') {
      return NextResponse.json(
        { success: false, error: '密碼錯誤' },
        { status: 401 }
      );
    }
    
    // 清空下架列表，刷新后产品将根据库存重新显示
    await clearDisabledProducts();
    
    return NextResponse.json({
      success: true,
      message: '數據已刷新，下架列表已清空'
    });
  } catch (error) {
    console.error('刷新失败:', error);
    return NextResponse.json(
      { success: false, error: '刷新失敗' },
      { status: 500 }
    );
  }
}
