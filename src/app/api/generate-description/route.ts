import { NextRequest, NextResponse } from 'next/server';
import { SearchClient, Config, HeaderUtils, LLMClient } from 'coze-coding-dev-sdk';

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
    
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    
    // 1. 联网搜索产品信息（限定在cigancigarwebsite.com网站）
    console.log('[生成介紹] 開始聯網搜索...');
    const searchClient = new SearchClient(config, customHeaders);
    const searchQuery = `${name} ${category || ''} ring gauge length flavor`;
    
    const searchResponse = await searchClient.advancedSearch(searchQuery, {
      count: 5,
      sites: 'cubancigarwebsite.com',
      needSummary: true
    });
    console.log('[生成介紹] 搜索結果數量:', searchResponse.web_items?.length || 0);
    
    // 2. 整理搜索结果
    let searchContext = '';
    if (searchResponse.web_items && searchResponse.web_items.length > 0) {
      searchContext = searchResponse.web_items
        .map(item => `${item.title}: ${item.snippet || ''}`)
        .filter(s => s.length > 0)
        .slice(0, 3)
        .join('\n');
    }
    console.log('[生成介紹] 搜索上下文:', searchContext.substring(0, 200));
    
    // 3. 使用LLM生成格式化介绍
    console.log('[生成介紹] 開始 LLM 生成...');
    const llmClient = new LLMClient(config, customHeaders);
    
    const systemPrompt = `你是雪茄專家。根據搜索資料，用繁體中文生成產品介紹。

必須嚴格按照以下格式輸出，每行一項，不要加方括號或其他符號：
外文名字: 產品的外文名稱
環徑: 環徑數值，單位Ring Gauge，如42
長度: 長度數值，單位英寸，如5 1/8
風味: 主要風味特點，如木質、堅果、皮革等
介紹: 30-50字的產品簡介

注意：
1. 根據搜索資料填寫準確數據
2. 介紹必須在30-50字之間
3. 每行格式要統一，冒號後面加一個空格
4. 直接輸出內容，不要加方括號`;

    const userPrompt = searchContext 
      ? `產品名稱：${name}
品牌：${category || '未知品牌'}

搜索資料：
${searchContext}

請生成產品介紹：`
      : `產品名稱：${name}
品牌：${category || '未知品牌'}

請生成產品介紹：`;

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: userPrompt
      }
    ];
    
    const response = await llmClient.invoke(messages, {
      model: 'doubao-seed-1-6-flash-250615',
      temperature: 0.7
    });
    
    console.log('[生成介紹] 生成成功:', response.content);
    
    return NextResponse.json({
      success: true,
      description: response.content
    });
  } catch (error) {
    console.error('[生成介紹] 生成失敗:', error);
    return NextResponse.json(
      { success: false, error: '生成產品介紹失敗: ' + (error instanceof Error ? error.message : '未知錯誤') },
      { status: 500 }
    );
  }
}
