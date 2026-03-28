import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { clearDisabledProducts } from '@/lib/productStore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const password = formData.get('password') as string;
    const file = formData.get('file') as File | null;
    
    // 验证密码
    if (password !== '1994') {
      return NextResponse.json(
        { success: false, error: '密碼錯誤' },
        { status: 401 }
      );
    }
    
    // 验证文件
    if (!file) {
      return NextResponse.json(
        { success: false, error: '請選擇文件' },
        { status: 400 }
      );
    }
    
    // 验证文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: '請上傳Excel文件（.xlsx或.xls）' },
        { status: 400 }
      );
    }
    
    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 保存到 assets 目录，保留原始檔名
    const filePath = path.join(process.cwd(), 'assets', file.name);
    await writeFile(filePath, buffer);
    
    // 清空下架列表（上新表格時自動解除所有下架）
    await clearDisabledProducts();
    
    return NextResponse.json({
      success: true,
      message: '批發表已更新',
      fileName: file.name,
      size: file.size
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { success: false, error: '上傳失敗' },
      { status: 500 }
    );
  }
}
