
---
title: "海康门禁实时事件采集服务"
date: 2026-07-23
description: "基于海康威视门禁设备的实时事件采集服务：控制台输出 + 内存事件缓存 + 内置 HTTP 服务（配置、事件 JSON、图片浏览）"
cover:
  image: 门禁.jpg
---
项目地址：[YQisme/Realtime-HikDoorEvent: 实时获取海康的门禁事件](https://github.com/YQisme/Realtime-HikDoorEvent)

海康威视 **明眸门禁（HCNetSDK）** 多设备实时事件采集服务：控制台输出 + 内存事件缓存 + 内置 HTTP 服务（配置、事件 JSON、图片浏览）。

## 功能概览

| 能力 | 说明 |
|------|------|
| 多门禁布防 | 按 `DeviceConfig.xml` 登录多台设备并接收回调 |
| 事件过滤 | 仅处理 **主类型=事件** 且 **次类型=75**（控制台显示为「未知事件类型(75)」） |
| 抓拍存储 | 图片保存到 `D:/Picture/{设备名称}/{员工姓名}/`，文件名含时间戳 |
| 员工姓名 | 启动时从 `[ApiBaseUrl]/api/employee` 拉取并写入运行目录 `EmployeeConfig.json`，事件里用员工号解析姓名 |
| 事件仓库 | 内存保留最近 **1000** 条，供 `/events` 查询 |
| Web 服务 | `HttpListener`，默认端口 **8080**（见 `app.config`） |

---

## 快速开始

### 环境要求

- **Windows x64**
- **.NET Framework 4.8**（见 `ACSEventConsole/app.config` 中 `supportedRuntime`）
- 本机可访问门禁设备网段；使用员工 API 时需能访问 `ApiBaseUrl`
- 海康 SDK 原生库已放在 `ACSEventConsole/bin`（与生成输出同目录使用）

### 编译

**Visual Studio**

1. 打开 `ACSEventConsole.sln`
2. 配置选 **x64**，**Debug** 或 **Release**
3. **生成 → 生成解决方案**

**命令行**（按本机修改 MSBuild 路径）：

```bat
cd /d E:\Desktop\GetACSEvent
"D:\VisualStudio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" ACSEventConsole.sln /p:Platform=x64 /p:Configuration=Debug
```

查找 MSBuild：

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" -latest -requires Microsoft.Component.MSBuild -find MSBuild\**\Bin\MSBuild.exe
```

### 运行

**必须从输出目录启动**（保证 `DeviceConfig.xml`、海康 DLL、`ACSEventConsole.exe.config` 在同一目录）：

```powershell
cd E:\Desktop\GetACSEvent\ACSEventConsole\bin\x64\Debug
.\ACSEventConsole.exe
```

Release 将路径中的 `Debug` 改为 `Release`。

启动后：

1. 尝试从员工 API 更新 `EmployeeConfig.json`（失败仅打日志，不阻止启动）
2. 按 `DeviceConfig.xml` 启动多门禁监控
3. 启动 Web；控制台会打印本机 IP 与端口，例如 `http://192.168.x.x:8080/`
4. **按 ESC** 退出

---

## 配置说明

### app.config（与 exe 同目录的 `ACSEventConsole.exe.config`）

| 键 | 默认值 | 说明 |
|----|--------|------|
| `WebServerUrl` | `http://localhost:8080` | 参考项 |
| `WebServerPort` | `8080` | Web 监听端口 |
| `PictureBasePath` | `D:/Picture` | 配置项（当前抓拍逻辑在代码中仍使用 `D:/Picture/...` 路径，修改存储位置需改代码或保持该盘符目录存在） |

### DeviceConfig.xml（运行目录）

程序读取 **exe 所在目录**下的 `DeviceConfig.xml`，不是源码目录。首次可从 `bin\x64\Debug\DeviceConfig.xml` 复制模板后修改。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Devices>
  <Config>
    <ApiBaseUrl>http://192.168.0.14:5000</ApiBaseUrl>
  </Config>
  <Device>
    <IP>192.168.0.164</IP>
    <UserName>admin</UserName>
    <Password>your_password</Password>
    <Port>8000</Port>
    <Enabled>true</Enabled>
    <Name>前门门禁</Name>
    <DeviceName>测试门禁164</DeviceName>
    <Remark>备注</Remark>
    <DeviceID>8f283fe3ca6947fdaba16db6ef3a7914</DeviceID>
    <AreaID>root000000</AreaID>
  </Device>
</Devices>
```

**字段说明**

| 字段 | 说明 |
|------|------|
| `IP` | 门禁主机 IP |
| `UserName` / `Password` | SDK 登录账号 |
| `Port` | 一般为 `8000` |
| `Enabled` | `true` 时参与登录布防 |
| `Name` / `DeviceName` | 展示用名称；图片目录使用设备名称相关字段 |
| `Remark` | 备注 |
| `DeviceID` / `AreaID` | 对接外部系统的标识 |
| `Config/ApiBaseUrl` | 员工（及可选设备）HTTP API 根地址；缺失时默认 `http://192.168.0.14:5000` |

也支持在 `<Devices>` 下直接写 `<ApiBaseUrl>`（与 `//Config/ApiBaseUrl` 二选一即可）。

### 外部 HTTP API（当前代码行为）

| 接口 | 状态 | 说明 |
|------|------|------|
| `GET {ApiBaseUrl}/api/employee` | **已启用** | 启动时拉取员工列表，保存 `EmployeeConfig.json`，填充 `EmployeeNameMap` |
| `GET {ApiBaseUrl}/api/device` | **默认关闭** | `ACSEventConsole.cs` 中设备合并逻辑已注释；需自动同步设备时可取消注释并调用 `DeviceConfigUpdater.UpdateFromApi` |

设备 API 若启用，合并规则（`DeviceConfigUpdater`）摘要：

- 筛选：`device_type` = 门禁 且 `is_important` = 否  
- 以 **IP** 为键：已存在则只更新 `DeviceID`、`AreaID`、`DeviceName`、`Name`；不存在则新增  
- 运行目录生成 `ApiDevice_raw.json`、`ApiDevice_filtered.json`  

---

## 内置 Web 服务

默认基址：`http://localhost:8080`（端口以 `app.config` 为准）。

程序会依次尝试绑定：`http://+:{port}/` → `http://localhost:{port}/` → `http://127.0.0.1:{port}/`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 导航页 |
| GET | `/events` | 最近事件 JSON 数组 |
| GET | `/config` | 当前 `DeviceConfig.xml` 原文 |
| GET | `/config/edit` | 表单编辑配置 |
| POST | `/config` | 保存配置（`application/x-www-form-urlencoded` 或原始 XML body） |
| GET | `/images` | 图片列表页（扫描 `D:/Picture`） |
| GET | `/images/{相对路径}` | 返回图片文件（URL 编码，支持中文路径） |

`/events` 字段说明、图片 URL 规则见 [docs/事件API说明.md](docs/事件API说明.md)。

### Web 无法启动（拒绝访问）

任选其一：

- 以**管理员**身份运行 `ACSEventConsole.exe`  
- 注册 URL ACL（将 `8080` 换成实际端口）：

```bat
netsh http add urlacl url=http://+:8080/ user=Everyone
```

---

## 事件与图片

- **控制台**：仅输出次类型 **75** 且主类型为「事件」的记录  
- **图片目录**：`D:/Picture/{设备名称}/{员工姓名}/`（需提前创建盘符目录或保证 `D:` 可用）  
- **内存**：最多 1000 条，通过 `/events` 读取  

更多图片命名、中文路径、测试脚本见 `docs/`：

- [事件API说明.md](docs/事件API说明.md)  
- [图片服务器使用说明.md](docs/图片服务器使用说明.md)  
- [中文路径访问说明.md](docs/中文路径访问说明.md)  
- `docs/测试事件API.bat`、`docs/测试图片服务器.bat` 等  

---

## 仓库目录结构

```
GetACSEvent/                      # 仓库根（文件夹名可不改）
  ACSEventConsole.sln
  README.md
  docs/                           # 补充文档与测试脚本
  ACSEventConsole/
    ACSEventConsole.cs            # 入口
    ACSEventMultiDeviceService.cs
    ACSEventService.cs            # SDK 回调与存图
    SimpleWebServer.cs
    DeviceConfigUpdater.cs
    EventStore.cs
    CHCNetSDK.cs
    app.config
    Properties/
    bin/                          # 海康 DLL + x64/Debug|Release 输出
      x64/Debug/ACSEventConsole.exe
      x64/Debug/DeviceConfig.xml  # 运行配置示例（部署时与 exe 同目录）
```

---

## 常见问题

| 问题 | 处理 |
|------|------|
| 找不到 DLL / SDK 初始化失败 | 在 `bin\x64\Debug`（或 Release）下运行，勿单独拷贝 exe |
| 门禁登录失败 | 检查 IP、8000 端口、账号密码、防火墙与网段 |
| Web 打不开 | 端口占用、URLACL、或改用管理员运行 |
| 改了配置不生效 | 编辑的是 **exe 同目录** 的 `DeviceConfig.xml`，或通过 `/config/edit` 保存 |
| XML 保存失败 | 根节点为 `<Devices>`，UTF-8 编码，无非法字符 |
| 员工姓名为空 | 确认 `ApiBaseUrl` 与 `/api/employee` 可访问；查看 `EmployeeConfig.json` |
| 无抓拍图 | 确认事件为类型 75；`D:/Picture` 目录可写 |

