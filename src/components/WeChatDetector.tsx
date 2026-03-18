'use client';

import { useState, useEffect } from 'react';

export default function WeChatDetector() {
  const [isWeChat, setIsWeChat] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isWeChatBrowser = ua.includes('micromessenger');
    setIsWeChat(isWeChatBrowser);
  }, []);

  if (!isWeChat) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-6">
      {/* 右上角箭头指示 */}
      <div className="absolute top-4 right-4 text-white">
        <svg 
          width="60" 
          height="80" 
          viewBox="0 0 60 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M10 20 L30 5 L50 20" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="30" y1="5" x2="30" y2="60" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      
      {/* 提示内容 */}
      <div className="text-center max-w-sm">
        <div className="mb-6">
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto"
          >
            <rect width="24" height="24" fill="none"/>
            <path 
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" 
              fill="white"
            />
          </svg>
        </div>
        
        <h2 className="text-white text-xl font-bold mb-4">
          請在瀏覽器中打開
        </h2>
        
        <div className="text-gray-300 text-sm mb-6 leading-relaxed">
          <p className="mb-3">1. 點擊右上角「···」按鈕</p>
          <p className="mb-3">2. 選擇「在瀏覽器中打開」</p>
          <p>或選擇「複製連結」後用瀏覽器打開</p>
        </div>
        
        {/* 复制链接按钮 */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('連結已複製，請用瀏覽器打開');
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          複製連結
        </button>
      </div>
    </div>
  );
}
