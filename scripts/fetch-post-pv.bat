@echo off
setlocal EnableExtensions
chcp 65001 >nul

cd /d "%~dp0.."

where node >nul 2>&1
if errorlevel 1 goto :no_node

where hugo >nul 2>&1
if errorlevel 1 goto :no_hugo

echo 正在拉取文章阅读量（将显示上次与最新对比）...
echo.

node "%~dp0fetch-post-pv.mjs"
if errorlevel 1 goto :failed

echo.
echo 完成。
exit /b 0

:no_node
echo [错误] 未找到 Node.js，请先安装 Node.js 18+ 并加入 PATH。
exit /b 1

:no_hugo
echo [错误] 未找到 hugo，请先安装 Hugo 并加入 PATH。
exit /b 1

:failed
echo.
echo [错误] 脚本执行失败。
exit /b 1
