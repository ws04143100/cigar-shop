import { NextRequest, NextResponse } from 'next/server';

// 簡單的內存存儲（注意：Vercel 部署後會重置，生產環境建議使用數據庫）
// 數據格式：{ [productId]: [{ name, content, createdAt }] }
const commentsStore: Record<string, Comment[]> = {};

interface Comment {
  name: string;
  content: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: '缺少產品ID' },
        { status: 400 }
      );
    }
    
    const comments = commentsStore[productId] || [];
    
    return NextResponse.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('獲取留言失敗:', error);
    return NextResponse.json(
      { success: false, error: '獲取留言失敗' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, name, content } = body;
    
    if (!productId || !name || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }
    
    // 初始化產品的留言數組
    if (!commentsStore[productId]) {
      commentsStore[productId] = [];
    }
    
    // 添加新留言
    const newComment: Comment = {
      name: name.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString()
    };
    
    commentsStore[productId].unshift(newComment); // 新留言放在最前面
    
    return NextResponse.json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('發布留言失敗:', error);
    return NextResponse.json(
      { success: false, error: '發布留言失敗' },
      { status: 500 }
    );
  }
}
