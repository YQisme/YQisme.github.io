---
title: "开发一个内置Chromium内核的自定义浏览器"
date: 2026-06-29
description: "基于独立Chromium 133内核的全屏浏览器应用"
cover:
  image: 2026-06-29_16-08-52.jpg
---
# Chromium Browser (Android 11)

基于 **独立 Chromium 133 内核** 的全屏浏览器应用（通过 WebViewUpgrade 内置 Google WebView APK）。

## 功能

- 内置 Chromium **133.0.6943.138** 内核，不依赖系统 WebView 版本
- 全屏单页浏览，无地址栏/导航栏
- 右下角 ⋮ 按钮可设置网址/IP、端口、路径
- 设置按钮**默认隐藏**，键鼠操作时显示，**10 秒无操作**后自动隐藏
- 设置页显示当前内核版本
- 支持**开机自启动**（可在设置中开关，默认开启）
- 最低支持 Android 11（API 30）

## 项目结构

```text
browser/
├── app/                              # Android 应用模块
│   └── src/main/
│       ├── assets/webview/           # 内置 Chromium WebView APK（构建前准备）
│       ├── java/com/chromium/browser/
│       │   ├── BrowserApplication.kt # Application 入口
│       │   ├── ui/                   # Activity、对话框
│       │   ├── kernel/               # Chromium 内核管理
│       │   ├── prefs/                # 用户设置持久化
│       │   └── receiver/               # 开机广播接收
│       └── res/                      # 布局、图标、字符串等资源
├── scripts/                          # 构建与部署脚本
│   ├── download-webview.ps1          # 下载/复制 WebView APK 到 assets
│   ├── setup-sdk.ps1                 # 安装 Android SDK 组件
│   ├── copy-apk.ps1                  # 复制 APK 到 dist/
│   ├── install-apk.ps1               # 安装 dist/ 中的 APK
│   └── adb.bat                       # adb 快捷调用
├── deps/                             # 本地大体积依赖（需自行下载，不提交 Git）
├── dist/                             # 构建输出的 APK（不提交 Git）
├── build-apk.bat                     # 一键构建（根目录快捷入口）
├── install-apk.bat                   # 一键安装
├── adb.bat                           # adb 快捷入口
├── gradlew / gradlew.bat             # Gradle Wrapper
└── settings.gradle.kts
```

## 已构建 APK

```bat
build-apk.bat
```

输出：`dist/{应用名称}-v{版本号}-debug.apk`（如 `dist/xx系统-v1.0-debug.apk`，体积约 250MB，含内置 Chromium 内核）

名称取自 `strings.xml` 的 `app_name`，版本号取自 `build.gradle.kts` 的 `versionName`。

安装（需在项目根目录下执行）：

```bat
install-apk.bat
```

或：

```bat
adb.bat install -r dist\xx系统-v1.0-debug.apk
adb.bat devices
```

> 不要直接输入 `adb`，系统 PATH 中未配置。请使用项目内的 `adb.bat` / `install-apk.bat`。

## 构建前准备

### 依赖下载

大体积文件推荐放入 `deps/`（也支持项目根目录）。`setup-sdk.ps1` 与 `download-webview.ps1` 会优先读取本地文件，缺失时部分依赖可自动下载。

| 文件 | 用途 | 下载链接 | 获取方式 |
|------|------|----------|----------|
| `commandlinetools-win-11076708_latest.zip` | Android SDK 命令行工具 | [Google](https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip) · [腾讯云镜像](https://mirrors.cloud.tencent.com/AndroidSDK/commandlinetools-win-11076708_latest.zip) | 手动下载后放入 `deps/` |
| `platform-34-ext7_r03.zip` | Android 34 平台 SDK | [Google](https://dl.google.com/android/repository/platform-34-ext7_r03.zip) · [腾讯云镜像](https://mirrors.cloud.tencent.com/AndroidSDK/platform-34-ext7_r03.zip) | 手动下载后放入 `deps/` |
| `platform-tools_r37.0.0-win.zip` | adb 等调试工具 | [腾讯云镜像](https://mirrors.cloud.tencent.com/AndroidSDK/platform-tools_r37.0.0-win.zip) | `setup-sdk.ps1` 自动下载 |
| `build-tools_r34-windows.zip` | 构建工具 34.0.0 | [腾讯云镜像](https://mirrors.cloud.tencent.com/AndroidSDK/build-tools_r34-windows.zip) | `setup-sdk.ps1` 自动下载 |
| `133.0.6943.138_min26_arm32+64.apk` | Chromium WebView 内核 | [GitHub Releases](https://github.com/JonaNorman/WebViewPackage/releases/download/google/133.0.6943.138_min26_arm32+64.apk) | 手动放入 `deps/`，或运行 `download-webview.ps1` 自动下载 |

WebView APK 复制到 assets 后的路径为 `app/src/main/assets/webview/google_webview_133.apk`。

### 1. Android SDK

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-sdk.ps1
```

需提前将 `commandlinetools-win-11076708_latest.zip` 与 `platform-34-ext7_r03.zip` 放入 `deps/`（见上表）。`platform-tools` 与 `build-tools` 由脚本自动从腾讯云镜像下载，无需手动准备。

### 2. Chromium WebView APK

```powershell
powershell -ExecutionPolicy Bypass -File scripts\download-webview.ps1
```

或直接运行 `build-apk.bat`（会自动调用上述脚本）。脚本会按以下顺序获取内核包：

1. 已存在于 `app/src/main/assets/webview/google_webview_133.apk`
2. `deps/` 或项目根目录中的 `133.0.6943.138_min26_arm32+64.apk`
3. 从 GitHub Releases 自动下载（见上表链接）

## 使用说明

1. 首次启动会显示内核加载进度（约数秒）
2. 加载完成后进入全屏浏览页
3. 默认地址 `http://192.168.0.37:3000/`（可在设置中修改）
4. 设置对话框底部显示当前 Chromium 内核版本
5. **开机自启动**：右下角 ⋮ → 设置 → 打开「开机自启动」，设备重启后会自动打开本应用并进入浏览页

> 部分品牌手机（小米、华为、OPPO 等）还需在系统设置里允许本应用的「自启动」权限，否则开机广播可能被系统拦截。

## 自定义应用名称与图标

修改后需重新运行 `build-apk.bat` 打包。

### 应用名称

编辑 `app/src/main/res/values/strings.xml`：

```xml
<string name="app_name">Chromium Browser</string>
```

将 `Chromium Browser` 改为你想要的名称。该名称会显示在桌面图标下方和任务切换器中（由 `AndroidManifest.xml` 的 `android:label="@string/app_name"` 引用）。

### 应用图标

当前图标资源位于 `app/src/main/res/mipmap-anydpi-v26/` 与 `drawable/ic_launcher_foreground.xml`。

**方式一：微调现有图标**

- 修改 `colors.xml` 中的 `ic_launcher_background` 更换背景色
- 修改 `ic_launcher_foreground.xml` 更换前景图案

**方式二：替换为自定义 PNG（推荐）**

1. 准备各密度 PNG（`mdpi`、`hdpi`、`xhdpi`、`xxhdpi`、`xxxhdpi`）
2. 放入 `app/src/main/res/mipmap-*/`，命名为 `ic_launcher.png` 与 `ic_launcher_round.png`
3. 或在 Android Studio 中：右键 `res` → **New → Image Asset**，按向导生成

### 版本号与包名（可选）

编辑 `app/build.gradle.kts` 的 `defaultConfig`：

```kotlin
applicationId = "com.chromium.browser"  // 包名，修改后视为新应用
versionCode = 1                           // 内部版本号，每次发版建议 +1
versionName = "1.0"                       // 用户可见版本号
```

### 输出 APK 文件名

`build-apk.bat` 打包完成后会自动复制到 `dist/` 并重命名为：

```text
dist/{app_name}-v{versionName}-debug.apk
```

- `app_name`：`strings.xml` 中的应用名称
- `versionName`：`build.gradle.kts` 中的版本号

修改应用名或版本号后重新打包，输出文件名会随之更新。

## 技术说明

- 使用 [WebViewUpgrade](https://github.com/JonaNorman/WebViewUpgrade) 在应用内加载独立 WebView APK
- 内核包来源：[WebViewPackage](https://github.com/JonaNorman/WebViewPackage) Google WebView 133
- 仅影响本应用，不修改系统全局 WebView
