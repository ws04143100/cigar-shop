import { NextRequest, NextResponse } from 'next/server';
import { setProductDisabled, getDisabledProducts } from '@/lib/productStore';

export async function POST(request: NextRequest) {
  try {
    const { password, productId, disabled } = await request.json();
    
    // 验证密码
    if (password !== '1994') {
      return NextResponse.json(
        { success: false, error: '密碼錯誤' },
        { status: 401 }
      );
    }
    
    // 验证参数
    if (!productId) {
      return NextResponse.json(
        { success: false, error: '缺少產品ID' },
        { status: 400 }
      );
    }
    
    // 设置下架状态
    const success = await setProductDisabled(productId, disabled);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: '操作失敗，請稍後重試' },
        { status: 500 }
      );
    }
    
    const disabledProducts = getDisabledProducts();
    
    return NextResponse.json({
      success: true,
      message: disabled ? '產品已下架' : '產品已上架',
      disabledProducts,
      note: '已提交 GitHub，Vercel 部署中...'
    });
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json(
      { success: false, error: '操作失敗' },
      { status: 500 }
    );
  }
}

// 获取下架列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    
    if (password !== '1994') {
      return NextResponse.json(
        { success: false, error: '密碼錯誤' },
        { status: 401 }
      );
    }
    
    const disabledProducts = getDisabledProducts();
    
    return NextResponse.json({
      success: true,
      disabledProducts
    });
  } catch (error) {
    console.error('获取下架列表失败:', error);
    return NextResponse.json(
      { success: false, error: '獲取失敗' },
      { status: 500 }
    );
  }
}
