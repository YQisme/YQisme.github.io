---
title: "在离岗及瞌睡检测系统"
date: 2026-07-17
description: "基于 YOLO 的实时目标检测系统，支持 80 个 COCO 类别，支持自定义多边形监控区域与报警。采用前后端分离（BS）架构，提供 Web 可视化界面"
cover:
  image: 效果图1.jpg
---

# YOLO 目标检测与区域报警系统

基于 YOLO 的实时目标检测系统，支持 80 个 COCO 类别，支持自定义多边形监控区域与报警。采用前后端分离（BS）架构，提供 Web 可视化界面。

核心能力：三种监测模式（区域报警 / 离岗监测 / 瞌睡监测）、按模式独立配置与推理控制、多档案管理、MQTT 推送、视频录制、摄像头状态与画面遮挡检测、报警事件中心、本地语音播报等。

 ![效果图1](./效果图1.jpg)

 ![效果图2](./效果图2.jpg) 

## 功能特性

- **三模式监测**：区域报警、离岗监测、瞌睡监测；配置 / 推理 / 日志按模式隔离
- **多档案管理**：按模式切换模型档案与视频档案，维护独立激活状态
- **目标检测**：YOLO 实时跟踪（80 类）；可动态切换模型与视频源；类别选择、自定义名称、置信度
- **区域报警**：多边形监控区域；多区域独立启用；防抖、中心点/边框模式、相同 ID 只报一次
- **离岗闭环**：离岗监测支持回岗确认
- **报警联动**：页面弹窗、声光报警、后端本地语音播报（可配置）
- **报警事件中心**：事件列表、媒体访问与导出；自动保存报警视频/图片
- **设备健康**：摄像头在线/离线检测、画面遮挡检测
- **运维能力**：登录认证、操作日志、后端/推理日志分离、GPU 自动检测、实时帧率与分辨率
- **显示定制**：字体/颜色、中英文切换、模型类别映射

## 三模式说明

| 模式 | 页面路由 | API 前缀 |
|------|----------|----------|
| 区域报警 | `/monitor` | `/api` |
| 离岗监测 | `/leave-monitor` | `/api/offpost` |
| 瞌睡监测 | `/drowsy-monitor` | `/api/drowsy` |

**配置隔离**（按模式独立，互不覆盖）：区域、报警参数、模型档案、视频档案。

**推理控制**：

- 接口：`<mode-prefix>/inference/*`
- 「开始推理」仅对当前模式生效
- 检测线程只在「当前激活模式 + 该模式 running=true」时执行

> 单引擎架构：`current_detection_profile` 随访问模式切换。「独立控制」指状态独立记录与展示，不是三模型并行推理。

**日志分流**：后端 `log` 事件携带 `profile`；前端按 `profile + logger` 展示，各模式页面互不重叠。

## 技术栈与系统要求

**后端**：Flask、Flask-SocketIO、Ultralytics YOLO、OpenCV、NumPy、Pillow、paho-mqtt（可选）、FFmpeg

**前端**：Vue 3、Vite、Vue Router、Element Plus、Socket.IO Client、Axios

**环境**：

- Python 3.10+
- CUDA GPU（推荐）
- RTSP / 本地视频 / 摄像头
- Node.js + yarn/npm（仅开发或构建前端时需要）
- FFmpeg、mpg123（录制/报警视频保存、本地语音播报时需要）

## 开发环境

```bash
chmod +x *.sh

# 系统依赖（录制 / 报警视频 / 本地播报，按需）
sudo apt-get update && sudo apt-get install -y ffmpeg mpg123   # Ubuntu/Debian
# sudo yum install -y ffmpeg mpg123                            # CentOS/RHEL

pip install -r requirements.txt
# 可选：pip install paho-mqtt
# NumPy 兼容问题：pip install "numpy>=1.24.0,<2.0.0" --force-reinstall

mkdir -p config && chmod 755 config
```

```bash
# 终端 1：后端
./start_server.sh
# 或：python3 backend/server.py

# 终端 2：前端热更新
cd frontend && yarn install && yarn dev
# 或：./start_frontend.sh
# 指定后端：VITE_API_URL=http://192.168.1.100:5000 ./start_frontend.sh
```

- 前端：`http://<IP>:5173`
- 后端：`http://<IP>:5000`（Vite 代理 `/api` 与 `/socket.io`）
- 默认账号：`admin` / `123456`（**首次登录请立即修改密码**）

## 生产部署

```bash
chmod +x *.sh
./deploy.sh          # 一键：依赖、目录、权限、可选构建前端
```

### 生产模式（推荐）

```bash
# 系统依赖与 Python 依赖同「开发环境」

# 构建前端（无 Node 时可在其他机器构建后拷贝 frontend/dist/）
cd frontend && yarn install && yarn build && cd ..

# 确认 models/ 下有模型文件，config/ 可写
mkdir -p config && chmod 755 config
chmod +x start_server.sh

./start_server.sh
# 或：python3 backend/server.py
```

浏览器访问：`http://<服务器IP>:5000`

生产模式需存在 `frontend/dist/`，且未设置 `VITE_DEV=true`。

### systemd（开机自启）

也可使用项目脚本：`./install_start_server_service.sh`

或手动创建 `/etc/systemd/system/yolo-detection.service`（路径与用户按实际修改）：

```ini
[Unit]
Description=YOLO Detection and Alarm System
After=network.target

[Service]
Type=simple
User=nvidia
WorkingDirectory=/home/nvidia/yzkj
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/usr/bin/python3 /home/nvidia/yzkj/backend/server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now yolo-detection
sudo systemctl status yolo-detection
sudo journalctl -u yolo-detection -f
```

### Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 部署后检查

- [ ] 服务启动无报错；可访问并登录
- [ ] 视频流正常；模型加载成功；GPU 状态正确（如有）
- [ ] `models/` 可读，`config/` 可写；防火墙已放行 5000（如需远程）
- [ ] 按需配置：视频源、监控区域、报警、MQTT

## 使用说明

### 系统配置

在「系统配置」中可设置：

- **检测模型 / 视频 URL**：动态切换
- **检测类别**：启用、自定义中文名、置信度
- **显示设置**：字体、边框、颜色、中英文、区域填充/边框/透明度（应用后立即生效）
- **报警设置**：防抖时间、中心点/边框模式、相同 ID 只报一次；本地语音播报（设备、音量、最小间隔）；音频文件位于 `audio/`（如 `drowsy.mp3`、`yawning.mp3`、`drowsy_yawning.mp3`、`offpost.mp3`）；前端试听走 `/api/audio/preview?file=<name>`
- **登录 / MQTT / 遮挡检测 / 报警事件保存**：见对应子项

摄像头状态：系统从 RTSP URL 提取 IP，按间隔检测在线/离线。

### 区域管理

1. 「创建区域」→ 画面上点击加点；靠近起点自动吸附；点击起点或双击完成
2. 至少 3 个顶点；`ESC` 取消；可编辑、重命名、启用/禁用、删除

### 视频录制与报警查看

- 开始/停止录制；列表预览、重命名、删除；默认按时长分段（如 5 分钟）
- 「报警记录」：区域进入、摄像头离线、画面遮挡等；受防抖与检测模式控制
- 「检测信息」：当前目标类别、ID、置信度、位置
- 「日志」：操作 / 后端 / 推理三类，按模式隔离，同时写入 `logs/`

### 本地语音播报说明

- `.mp3` → 优先 `mpg123`，回退 `ffplay`；`.wav` → `aplay`
- 直接用 `aplay` 播 `.mp3` 会噪音；需安装 `mpg123`

```bash
which mpg123 ffplay aplay
mpg123 -a hw:0,0 audio/drowsy.mp3
ls -l audio
```

## 项目结构

```
.
├── backend/
│   ├── server.py              # Flask 后端
│   └── logging_config.py
├── frontend/                  # Vue3 + Vite
│   ├── src/
│   │   ├── components/        # 视频、配置、报警、区域、日志等
│   │   ├── views/             # 登录、主页、系统设置、报警事件等
│   │   └── router/
│   └── dist/                  # 生产构建产物
├── models/                    # YOLO 模型（.pt / .onnx / .engine）
├── config/                    # 运行时配置（自动生成/更新）
├── logs/                      # backend.log / yolo.log
├── recordings/                # 录制视频
├── alarm_events/              # 报警事件 videos/ images/
├── audio/                     # 本地播报音频
├── tools/                     # 辅助脚本
├── deploy.sh / start_server.sh / start_frontend.sh / stop_server.sh
├── requirements.txt
└── README.md
```

## 配置说明

配置均在 `config/`，多数可通过前端或 API 修改，重启后自动加载。

| 文件 | 用途 |
|------|------|
| `zones_config.json` | 多区域多边形 |
| `system_config.json` | 模型、视频 URL、摄像头 IP/检测间隔 |
| `classes_config.json` | 启用类别、自定义名、置信度 |
| `display_config.json` | 字体、颜色、中英文、区域样式 |
| `model_classes.json` | 模型类别映射（非 COCO 时需配置） |
| `alarm_config.json` | 防抖、检测模式、事件保存等 |
| `offpost_alarm_config.json` / `drowsy_alarm_config.json` | 离岗 / 瞌睡报警 |
| `model_profile_config.json` / `video_profile_config.json` | 模型/视频档案 |
| `occlusion_config.json` | 遮挡检测 |
| `mqtt_config.json` | MQTT |
| `login_config.json` | 登录账号 |
| `recording_config.json` | 录制路径与分段时长 |
| `secret_key.txt` | Session 密钥 |

**报警要点**：

- `detection_mode`：`center`（中心点，更严）/ `edge`（边框，更敏）
- `once_per_id`：整个跟踪生命周期只报一次
- 事件文件命名示例：`alarm_YYYYMMDD_HHMMSS_ID{track_id}_{object_name}_{zone_name}.mp4/jpg`

**日志**：`logs/backend.log`（系统）、`logs/yolo.log`（推理）；轮转约 10MB × 5。

**GPU**：自动检测，不可用时回退 CPU；可通过 `/api/status` 查看。

## API 概要

旧单区域 `/api/polygon` 已废弃，请用 `/api/zones`。三模式推理前缀见上文。

### 常用 REST

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/status` | 系统状态（含 GPU） |
| GET/POST | `/api/models`、`/api/model` | 模型列表 / 切换 |
| GET/POST | `/api/video` | 视频源 |
| GET/POST | `/api/classes*` | 类别与置信度 |
| GET/POST | `/api/display` | 显示配置 |
| GET/POST | `/api/model-classes` | 模型类别映射 |
| GET/POST | `/api/alarm` | 报警配置 |
| POST/GET | `/api/login*` | 登录认证 |
| CRUD | `/api/zones` | 区域管理 |
| GET/POST | `/api/mqtt`、`/api/occlusion` | MQTT / 遮挡 |
| * | `/api/recording/*` | 录制控制与视频管理 |
| GET | `/api/video/stream`、`/api/video/processed_stream` | MJPEG 流 |
| GET/POST | `<prefix>/inference*` | 按模式推理控制 |

颜色：前端 API 使用 RGB；后端对部分字段存为 BGR（OpenCV）。

### WebSocket

- 客户端：`connect` / `disconnect`
- 服务端：`connected`、`frame`（帧 + detections + fps）、`log`（含 `profile`）、`alarm`（`zone` / `camera_offline` / `occlusion`）

推理状态示例：`GET /api/offpost/inference` → `{ "running", "profile", "active_profile", "any_running", "auto_start" }`

## 常见问题

**NumPy / 导入错误**：`pip install "numpy>=1.24.0,<2.0.0" --force-reinstall`

**端口占用**：`sudo lsof -i :5000`，或修改 `backend/server.py` 端口

**权限**：确保项目目录与 `config/` 可写，启动脚本可执行

**前端构建失败**：Node 16+；`cd frontend && rm -rf node_modules dist && yarn install && yarn build`

**模型加载失败**：检查 `models/` 存在与权限；`tail -f logs/backend.log`

**systemd + Werkzeug**：代码已加 `allow_unsafe_werkzeug=True`；高并发可考虑 gunicorn + gevent

**视频连不上 / 检不到目标**：核对 RTSP、类别是否启用、置信度、模型类别映射

**WebSocket 失败**：防火墙与服务是否监听 5000

**中文方块**：安装字体后重启

```bash
sudo apt-get install fonts-wqy-microhei fonts-wqy-zenhei   # Ubuntu
# sudo yum install wqy-microhei-fonts wqy-zenhei-fonts     # CentOS
```

**帧率低**：改英文显示、降分辨率、确认 GPU、少开类别

**MQTT / 登录 / 遮挡误报 / 录制与报警视频失败**：检查对应配置、`paho-mqtt`、FFmpeg、路径权限与网络；遮挡可调高阈值或关闭

**开发前端无法用 IP 访问**：用 `./start_frontend.sh`（监听 `0.0.0.0`）；必要时设 `VITE_API_URL`

## 性能建议

1. 优先使用 TensorRT `.engine`
2. 英文显示减少 PIL 开销
3. 适当降低分辨率；只启用必要类别；合理置信度
4. 保证 GPU 与 RTSP 带宽

## 开发说明

非 COCO 模型：通过 `/api/model-classes` 或编辑 `config/model_classes.json` 配置中英文类别列表。

扩展报警：在 `backend/server.py` 的报警触发逻辑中增加截图、HTTP 回调等。

