@echo off
chcp 65001 > nul
title UniFicticia - Iniciando...

:: Verifica se Node.js ja esta instalado
node -v > nul 2>&1
if %errorlevel% == 0 goto :killOld

:: Node.js nao encontrado: tenta instalar via winget
echo.
echo  Node.js nao encontrado. Instalando automaticamente...
echo  (Isso pode levar alguns minutos)
echo.

winget --version > nul 2>&1
if %errorlevel% neq 0 goto :downloadNode

winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
if %errorlevel% == 0 (
    echo  Aguardando Node.js ficar disponivel...
    timeout /t 5 > nul
    for /f "tokens=*" %%i in ('where node 2^>nul') do set NODE_PATH=%%i
    if not defined NODE_PATH (
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
    )
    node -v > nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  AVISO: Node.js instalado mas nao detectado nesta sessao.
        echo  Feche esta janela, abra um novo Prompt e rode iniciar.bat novamente.
        echo.
        pause
        exit /b 1
    )
    goto :killOld
)

:: Fallback: baixa o instalador direto do nodejs.org
:downloadNode
echo  Baixando instalador do Node.js...
set "INSTALLER=%TEMP%\node_installer.msi"
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/lts/node-latest-x64.msi' -OutFile '%INSTALLER%'"
if not exist "%INSTALLER%" (
    echo.
    echo  ERRO: Nao foi possivel baixar o Node.js.
    echo  Acesse https://nodejs.org e instale manualmente.
    echo.
    pause
    exit /b 1
)
msiexec /i "%INSTALLER%" /quiet /qn /norestart
echo  Aguardando conclusao da instalacao...
:waitNode
timeout /t 3 > nul
node -v > nul 2>&1
if %errorlevel% neq 0 (
    where node > nul 2>&1
    if %errorlevel% neq 0 goto :waitNode
)
set "PATH=%PATH%;%ProgramFiles%\nodejs"
del "%INSTALLER%"

:: Encerra qualquer processo ja rodando na porta 3000
:killOld
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a > nul 2>&1
)

:: Inicia o servidor
:startServer
echo.
echo  Iniciando servidor...
echo.

start "" /b cmd /c "timeout /t 2 > nul && start http://localhost:3000"

node server.js
pause
