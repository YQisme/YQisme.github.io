@echo off
setlocal EnableExtensions
chcp 65001 >nul

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 goto :no_node

where hugo >nul 2>&1
if errorlevel 1 goto :no_hugo

echo 正在同步目录同名 .md → index.md，并启动 Hugo 预览（含草稿）...
echo.

node "%~dp0scripts\hugo.mjs" server -D %*
if errorlevel 1 goto :failed

exit /b 0

:no_node
echo [错误] 未找到 Node.js，请先安装 Node.js 18+ 并加入 PATH。
exit /b 1

:no_hugo
echo [错误] 未找到 hugo，请先安装 Hugo Extended 并加入 PATH。
exit /b 1

:failed
echo.
echo [错误] 预览启动失败。
exit /b 1
