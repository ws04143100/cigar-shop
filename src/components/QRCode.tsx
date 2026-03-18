'use client';

import { useEffect, useRef } from 'react';

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCode({ url, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 简单的 QR Code 生成（使用 Google Chart API 的替代方案）
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 使用 QR Server API 生成二维码
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.src = qrUrl;
  }, [url, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size}
      className="mx-auto"
    />
  );
}
