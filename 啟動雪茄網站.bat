@echo off
chcp 65001 >nul
title 雪茄精品館 - 啟動腳本

echo ========================================
echo   雪茄精品館 - 啟動腳本
echo ========================================
echo.

:: 終止舊進程
echo [1/4] 終止舊進程...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM cloudflared.exe 2>nul
timeout /t 2 /nobreak >nul

:: 啟動網站伺服器
echo [2/4] 啟動網站伺服器...
cd /d C:\Users\USER\.openclaw\workspace\cigar-shop
start /B node dist/server.js > nul 2>&1
timeout /t 3 /nobreak >nul

:: 啟動 Cloudflare Tunnel
echo [3/4] 啟動 Cloudflare Tunnel...
cd /d C:\Users\USER\.cloudflared
start /B cloudflared.exe tunnel run --url http://localhost:5000 > tunnel.log 2>&1

:: 等待連線
echo [4/4] 等待連線...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   啟動完成！
echo.
echo   網站網址：
echo   https://www.cigarsshopvip.cc
echo   https://cigarsshopvip.cc
echo.
echo   注意：電腦關機後需重新運行此腳本
echo ========================================
echo.
pause
