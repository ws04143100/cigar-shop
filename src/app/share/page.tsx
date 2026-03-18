'use client';

import { useState } from 'react';
import QRCode from '@/components/QRCode';

export default function SharePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sanluisvip.coze.site/home';
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 兼容
      const input = document.createElement('input');
      input.value = siteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addToHome = () => {
    // PWA 添加到主屏幕提示
    alert('請點擊瀏覽器菜單中的「添加到主屏幕」或「加入桌面捷徑」');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
            <path d="M12 22V12"></path>
            <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">雪茄精品館</h1>
        <p className="text-gray-500 text-sm mb-6">掃碼或點擊下方按鈕進入商城</p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
          <QRCode url={siteUrl} size={180} />
          <p className="text-xs text-gray-400 mt-2">用手機瀏覽器掃碼打開</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <a 
            href={siteUrl}
            className="block w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            進入商城
          </a>
          
          <button
            onClick={copyLink}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                已複製
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
                複製連結
              </>
            )}
          </button>

          <button
            onClick={addToHome}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            添加到主屏幕
          </button>
        </div>

        {/* Tip */}
        <div className="mt-6 p-4 bg-amber-50 rounded-xl text-left">
          <p className="text-amber-800 text-xs leading-relaxed">
            💡 <strong>提示：</strong>將此頁面添加到手機主屏幕，即可像App一樣快速打開商城
          </p>
        </div>
      </div>
    </div>
  );
}
