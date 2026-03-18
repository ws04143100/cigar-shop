import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category } = body;
    
    console.log('[生成介紹] 收到請求:', { name, category });
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: '產品名稱不能為空' },
        { status: 400 }
      );
    }
    
    const apiKey = process.env.MINIMAX_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key 未配置' },
        { status: 500 }
      );
    }
    
    // 使用 MiniMax API 生成產品介紹
    console.log('[生成介紹] 開始調用 MiniMax API...');
    
    const systemPrompt = `你是雪茄專家。用繁體中文為雪茄產品生成專業的產品介紹。

必須嚴格按照以下格式輸出，每行一項，不要加方括號或其他符號：
外文名字: 產品的外文名稱
環徑: 環徑數值，單位Ring Gauge，如42
長度: 長度數值，單位英寸，如5 1/8
風味: 主要風味特點，如木質、堅果、皮革、咖啡等
介紹: 30-50字的產品簡介

注意：
1. 介紹必須在30-50字之間
2. 每行格式要統一，冒號後面加一個空格
3. 直接輸出內容，不要加方括號`;

    const userPrompt = `產品名稱：${name}
品牌：${category || '未知品牌'}

請生成專業的雪茄產品介紹：`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[生成介紹] API 請求失敗:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: 'API 請求失敗: ' + response.status },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    console.log('[生成介紹] API 回應:', JSON.stringify(data).substring(0, 200));
    
    // 從回應中提取生成的內容
    const description = data.choices?.[0]?.message?.content || '';
    
    if (!description) {
      return NextResponse.json(
        { success: false, error: '生成內容為空' },
        { status: 500 }
      );
    }
    
    console.log('[生成介紹] 生成成功:', description.substring(0, 100));
    
    return NextResponse.json({
      success: true,
      description: description
    });
  } catch (error) {
    console.error('[生成介紹] 生成失敗:', error);
    return NextResponse.json(
      { success: false, error: '生成產品介紹失敗: ' + (error instanceof Error ? error.message : '未知錯誤') },
      { status: 500 }
    );
  }
}
