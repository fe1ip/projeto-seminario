@echo off
title LocalTunnel - Projeto Seminario (porta 3000)
echo ================================================
echo   LocalTunnel com reconexao automatica
echo   Porta: 3000
echo   Pressione CTRL+C para encerrar
echo ================================================
echo.

:loop
echo [%time%] Iniciando tunnel...
npx localtunnel --port 3000 --subdomain projeto-seminario
echo.
echo [%time%] Tunnel encerrado. Reconectando em 3 segundos...
timeout /t 3 /nobreak >nul
echo.
goto loop
