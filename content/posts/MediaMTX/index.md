
---
title: "MediaMTX 快速入门"
date: 2026-08-11
lastmod: 2026-08-11
draft: false
tags: ["MediaMTX", "RTSP", "WebRTC", "流媒体", "Docker"]
categories: ["技术", "教程"]
---

**MediaMTX** 是一个开源的**实时音视频流媒体服务器（Media Server / Media Proxy）**，以前叫 **rtsp-simple-server**，后来功能扩展后改名为 MediaMTX。它的定位类似一个“视频流路由器”：负责接收、转发、转换、录制各种实时视频流。

  ![image-20260811145738315](./image-20260811145738315.png) 

简单理解：

> 摄像头、程序、浏览器之间的视频“中转站”。

------

# 1. 它解决什么问题？

例如你有一个海康摄像头：

```
摄像头
  |
  | RTSP
  |
  ↓
MediaMTX
  |
  ├── 浏览器(WebRTC)
  ├── VLC
  ├── Unity
  ├── OpenCV
  ├── FFmpeg
  └── 录像文件
```

摄像头通常只提供：

```
rtsp://192.168.1.100/Streaming/Channels/101
```

但是：

- 浏览器不能直接播放 RTSP
- 微信、小程序不方便播放 RTSP
- Unity WebGL 不支持 RTSP
- 多个人同时访问摄像头会增加摄像头压力

MediaMTX 就在中间转换。



------

# 2. MediaMTX主要功能

## ① RTSP 转 WebRTC（最常用）

例如：

摄像头：

```
RTSP
↓
MediaMTX
↓
WebRTC
↓
浏览器实时播放
```

优点：

- 延迟低（通常几百毫秒）
- 浏览器直接播放
- 适合监控、AI检测

例如：

网页：

```
https://server:8889/camera1
```

直接看到摄像头画面。



------

## ② RTSP 转 HLS

例如：

```
摄像头
 ↓
RTSP
 ↓
MediaMTX
 ↓
HLS (.m3u8)
 ↓
网页播放器
```

适合：

- 大量用户观看
- 直播
- 手机浏览器

缺点：

延迟较高：

```
WebRTC:
约 0.2~1秒

HLS:
3~20秒
```

------

## ③ 多人共享一路摄像头

没有 MediaMTX：

```
摄像头
 |
 +-- 用户1
 |
 +-- 用户2
 |
 +-- AI程序
 |
 +-- 录像
```

摄像头压力很大。

有 MediaMTX：

```
摄像头
 |
MediaMTX
 |
 +-- 用户1
 +-- 用户2
 +-- AI
 +-- 录像
```

摄像头只需要输出一次。

------

## ④ 录像

MediaMTX可以：

```
实时流
 ↓
保存
 ↓
fMP4 / MPEG-TS
```

用于：

- 监控录像
- 回放
- 事件录像



------

## ⑤ 协议转换

支持：

输入：

```
RTSP
RTMP
SRT
WebRTC
RTP
HLS
```

输出：

```
RTSP
RTMP
WebRTC
HLS
SRT
```

例如：

```
无人机
(SRT)
 ↓
MediaMTX
 ↓
网页
(WebRTC)
```



------

MediaMTX特点：

> 小、轻、部署简单。

一个二进制文件即可运行。

# 安装

它本身是 **Go 编写的跨平台单文件程序**，不依赖 Linux 环境。

支持：

- ✅ Windows Server 2016/2019/2022
- ✅ Windows 10/11
- ✅ Linux
- ✅ Docker
- ✅ ARM64（如树莓派、Orange Pi 等）

## windows

可以，**MediaMTX 可以直接运行在 Windows Server 2022 上**，而且非常适合这种服务器环境。

### 1. 下载 Windows 版本

官方 Release：

[MediaMTX GitHub Releases](https://github.com/bluenviron/mediamtx/releases)

下载类似：

```
mediamtx_v1.xx.x_windows_amd64.zip
```

你的 Windows Server 2022 一般是：

```
x86_64 / AMD64
```

所以选：

```
windows_amd64
```

------

### 2. 解压

例如：

```
D:\mediamtx\
│
├── mediamtx.exe
└── mediamtx.yml
```

------

### 3. 启动

CMD：

```
cd D:\mediamtx

mediamtx.exe
```

看到：

```
INF MediaMTX v1.x.x
INF [RTSP] listener opened on :8554
INF [RTMP] listener opened on :1935
INF [HLS] listener opened on :8888
INF [WebRTC] listener opened on :8889
```

说明成功。

------

### 4. 设置成 Windows 服务

服务器一般需要：

- 开机自动启动
- 后台运行

可以使用**任务计划程序**

以后服务器重启会自动启动。

------

### 5. Windows防火墙开放端口

需要开放：

| 端口 | 协议 | 用途   |
| ---- | ---- | ------ |
| 8554 | TCP  | RTSP   |
| 8888 | TCP  | HLS    |
| 8889 | TCP  | WebRTC |
| 1935 | TCP  | RTMP   |

例如：

```
New-NetFirewallRule `
-DisplayName "MediaMTX RTSP" `
-Direction Inbound `
-Port 8554 `
-Protocol TCP `
-Action Allow
```

## Linux

在[MediaMTX GitHub Releases](https://github.com/bluenviron/mediamtx/releases)中下载

```
mediamtx_v1.20.0_linux_amd64.tar.gz
```

说明是 **Linux x86_64版本**，适用于：

- Ubuntu 20.04 / 22.04 / 24.04
- Debian
- CentOS
- 其他 amd64 Linux

安装非常简单，MediaMTX 官方提供的独立二进制包解压后即可运行。

下面一步一步操作。

------

### 1. 解压文件

假设文件在：

```
~/Downloads/
```

进入目录：

```
cd ~/Downloads
```

解压：

```
tar -zxvf mediamtx_v1.20.0_linux_amd64.tar.gz
```

解压后：

```
mediamtx_v1.20.0_linux_amd64/
├── mediamtx
└── mediamtx.yml
```

进入目录：

```
cd mediamtx_v1.20.0_linux_amd64
```

------

### 2. 给执行权限

查看：

```
ls -l
```

如果看到：

```
-rwxr-xr-x mediamtx
```

说明已经有权限。

如果没有：

```
chmod +x mediamtx
```

------

### 3. 第一次启动测试

直接运行：

```
./mediamtx
```

正常应该看到：

```
INF MediaMTX v1.20.0
INF [RTSP] listener opened on :8554
INF [RTMP] listener opened on :1935
INF [HLS] listener opened on :8888
INF [WebRTC] listener opened on :8889
```

说明成功。

------

### 4.配置摄像头

编辑：

```
nano /opt/mediamtx/mediamtx.yml
```

在最后添加：

```
paths:

  camera1:
    source: rtsp://admin:密码@192.168.1.100:554/Streaming/Channels/101
```

保存。

启动：

```
cd /opt/mediamtx

./mediamtx
```

------

### 5. 测试 RTSP

你的流地址：

```
rtsp://Ubuntu服务器IP:8554/camera1
```

例如：

```
rtsp://192.168.1.50:8554/camera1
```

VLC打开测试。

------

### 6. 测试浏览器播放

打开：

```
http://Ubuntu服务器IP:8889/camera1
```

如果 WebRTC 正常：

浏览器直接看到画面。

------

### 7.设置开机启动

Ubuntu 使用 systemd。

创建：

```
sudo nano /etc/systemd/system/mediamtx.service
```

内容：

```
[Unit]
Description=MediaMTX Streaming Server
After=network.target

[Service]
Type=simple
ExecStart=/opt/mediamtx/mediamtx /opt/mediamtx/mediamtx.yml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

保存。

加载：

```
sudo systemctl daemon-reload
```

设置开机启动：

```
sudo systemctl enable mediamtx
```

启动：

```
sudo systemctl start mediamtx
```

查看状态：

```
systemctl status mediamtx
```

------

### 8. 开放防火墙（如果启用）

Ubuntu：

```
sudo ufw allow 8554/tcp
sudo ufw allow 8888/tcp
sudo ufw allow 8889/tcp
sudo ufw allow 9997/tcp
```

------

### 9. 开启 API

修改：

```
api: yes
```

然后访问：

```
http://UbuntuIP:9997/v3/paths/list
```

可以看到：

- 摄像头列表
- 在线状态
- 当前访问人数

# 录像回放

MediaMTX **自带录像功能**，不需要额外安装 FFmpeg。它可以把接入的 RTSP/WebRTC 等流保存为文件，适合监控录像、事件回放。

------

## 1. 开启录像功能

编辑：

```
mediamtx.yml
```

找到：

```
pathDefaults:
```

增加：

```
pathDefaults:
  record: yes
  recordPath: ./recordings/%path/%Y-%m-%d_%H-%M-%S
  recordFormat: fmp4
```

例如：

```
pathDefaults:
  record: yes
  recordPath: D:/mediamtx/recordings/%path/%Y-%m-%d_%H-%M-%S
  recordFormat: fmp4
```

保存。

重启：

```
mediamtx.exe
```

------

## 2. 配置摄像头

例如海康：

```
paths:

  camera1:
    source: rtsp://admin:密码@192.168.1.100:554/Streaming/Channels/101
```

完整：

```
pathDefaults:
  record: yes
  recordPath: D:/mediamtx/recordings/%path/%Y-%m-%d_%H-%M-%S
  recordFormat: fmp4


paths:
  camera1:
    source: rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101
```

------

## 3. 录像文件效果

运行后：

目录：

```
D:\mediamtx\recordings
│
└── camera1
    │
    ├── 2026-08-10_10-00-00.mp4
    ├── 2026-08-10_10-01-00.mp4
    └── 2026-08-10_10-02-00.mp4
```

------

## 4. 设置录像分片时间（非常重要）

监控不能生成一个几十GB的大文件。

推荐：

```
recordSegmentDuration: 1h
```

例如：

```
pathDefaults:
  record: yes
  recordSegmentDuration: 1h
```

效果：

```
camera1

10:00.mp4
11:00.mp4
12:00.mp4
13:00.mp4
```

方便：

- 删除旧录像
- 快速检索
- 备份

------

## 5. 只录制指定摄像头

不是所有流都录像：

```
paths:

  camera1:
    source: rtsp://admin:xxx@192.168.1.100/xxx
    record: yes

  camera2:
    source: rtsp://admin:xxx@192.168.1.101/xxx
    record: no
```

------

## 6. 设置自动删除历史录像

例如只保存7天：

```
pathDefaults:
  record: yes
  recordDeleteAfter: 168h
```

计算：

```
7天 × 24小时 = 168小时
```

超过7天自动删除。

------

## 7. 查看录像

MPV：

```
mpv D:\mediamtx\recordings\camera1\xxx.mp4
```

VLC：

```
媒体 → 打开文件
```

---

**回放**

## 开启 Playback API

配置：

```
playback: yes
```

默认端口：

```
9996
```

例如：

```
http://192.168.1.100:9996
```

------

## 查询录像列表

### 接口

```
GET /list?path=<路径名>
```

端口：

```
9996
```

------

### 示例

查询 camera1：

```
curl \
"http://127.0.0.1:9996/list?path=camera1"
```

------

### 返回

```
[
  {
    "start": "2026-08-11T14:46:33.630385+08:00",
    "duration": 121.153,
    "url": "http://127.0.0.1:9996/get?duration=121.153&path=camera1&start=2026-08-11T14%3A46%3A33.630385%2B08%3A00"
  }
]
```

说明：

| 字段     | 说明               |
| -------- | ------------------ |
| start    | 录像开始时间       |
| duration | 录像持续时间（秒） |
| url      | 该录像片段播放地址 |

------

## 按摄像头查询录像

例如：

查询：

```
摄像头:
camera1
```

请求：

```
GET http://服务器:9996/list?path=camera1
```

例如：

```
curl \
"http://192.168.1.100:9996/list?path=camera1"
```

返回：

```
[
 {
  "start":"2026-08-11T14:46:33+08:00",
  "duration":121.153
 }
]
```

------

## 按时间查询录像

MediaMTX Playback 的方式不是：

```
/v1/recordings/list?start=xxx
```

而是：

先获取：

```
/list?path=camera1
```

得到录像片段：

```
[
 {
  "start":"14:46:33",
  "duration":121
 }
]
```

然后根据时间选择对应片段。

------

例如：

目标：

```
camera1

2026-08-11

14:46:40
```

找到：

```
14:46:33
+
121秒
```

这个录像段。

------

## 播放录像

使用 `/get`

格式：

```
http://服务器:9996/get?
path=摄像头名称
&start=开始时间
&duration=时长
```

------

例如：

```
http://192.168.1.100:9996/get?
path=camera1
&start=2026-08-11T14:46:33.630385+08:00
&duration=121.153
```

浏览器即可播放。

# HTTP API

MediaMTX 的 HTTP API（官方称 **Control API**）主要用于**程序化管理和监控 MediaMTX**，比如：

- 查看当前有哪些摄像头流
- 查看在线状态
- 查看 RTSP/WebRTC/HLS 连接
- 动态添加/修改摄像头
- 控制录像
- 踢掉客户端
- 给你的 Vue/React 管理平台提供数据

MediaMTX 默认关闭，需要开启。

------

## 1. 开启 HTTP API

编辑：

```
mediamtx.yml
```

增加：

```
api: yes
```

启动：

```
mediamtx.exe
```

默认监听：

```
http://127.0.0.1:9997
```

官方示例也是通过：

```
curl http://127.0.0.1:9997/v3/paths/list
```

查询流。

>如果需要局域网访问的话
>
> `ips: ["127.0.0.1", "::1"]`设置为`ips: []`

------

## 2. 查看所有视频流

接口：

```
GET /v3/paths/list
```

Windows测试：

PowerShell：

```
curl http://127.0.0.1:9997/v3/paths/list
```

返回类似：

```
{
  "itemCount": 1,
  "pageCount": 1,
  "items": [
    {
      "name": "camera1",
      "confName": "camera1",

      "ready": true,
      "readyTime": "2026-08-11T14:16:31+08:00",

      "available": true,
      "availableTime": "2026-08-11T14:16:31+08:00",

      "online": true,
      "onlineTime": "2026-08-11T14:16:31+08:00",

      "source": {
        "type": "rtspSource",
        "id": ""
      },

      "tracks": [
        "H265"
      ],

      "tracks2": [
        {
          "codec": "H265",
          "codecProps": {
            "width": 2560,
            "height": 1440,
            "profile": "Main",
            "level": "5.1"
          }
        }
      ],

      "readers": [
        {
          "type": "webRTCSession",
          "id": "xxxx"
        }
      ],

      "inboundBytes": 29681480,
      "outboundBytes": 74607920,

      "bytesReceived": 29681480,
      "bytesSent": 74607920,

      "inboundFramesInError": 0
    }
  ]
}
```

**字段说明**

### 1. 顶层字段

| 字段      | 类型  | 说明                 | 示例            |
| --------- | ----- | -------------------- | --------------- |
| itemCount | int   | 当前返回的视频流数量 | 4               |
| pageCount | int   | 分页数量             | 1               |
| items     | array | 视频流列表           | camera1~camera4 |

------

### 2. 视频流基本信息

| 字段     | 类型   | 说明               |
| -------- | ------ | ------------------ |
| name     | string | MediaMTX中的流名称 |
| confName | string | 配置中的名称       |

例如：

```
"name":"camera1"
```

对应：

```
rtsp://服务器:8554/camera1
```

------

### 3. 流状态字段

#### ready

```
"ready":true
```

| 值    | 说明                 |
| ----- | -------------------- |
| true  | 流已经建立，可以播放 |
| false | 没有准备好           |

------

#### readyTime

```
"readyTime":
"2026-08-11T14:16:31"
```

表示：

> 流第一次准备完成时间

------

#### available

```
"available":true
```

表示：

| 状态  | 说明       |
| ----- | ---------- |
| true  | 存在视频源 |
| false | 没有源     |

例如：

摄像头断电：

```
available=false
```

------

#### online

```
"online":true
```

表示：

当前流是否在线。

通常：

```
ready=true
available=true
online=true
```

表示正常。

------

### 4. 视频来源 source

模板：

```
"source":
{
"type":"rtspSource",
"id":""
}
```

| 字段 | 说明     |
| ---- | -------- |
| type | 输入类型 |
| id   | 来源ID   |

常见：

| type       | 说明       |
| ---------- | ---------- |
| rtspSource | RTSP摄像头 |
| publisher  | 推流端     |
| redirect   | 转发流     |

你的：

```
"type":"rtspSource"
```

表示：

```
海康摄像头
       |
       RTSP
       |
    MediaMTX
```

------

### 5. 视频轨道 tracks

示例：

```
"tracks":
[
"H265",
"MPEG-4 Audio"
]
```

表示：

该流包含：

| 类型         | 说明     |
| ------------ | -------- |
| H264         | 视频     |
| H265         | 视频     |
| MPEG-4 Audio | AAC音频  |
| G711         | 对讲音频 |

------

### 6. 详细编码信息 tracks2

结构：

```
"tracks2":
[
 {
  "codec":"H265",
  "codecProps":
  {
    "width":2560,
    "height":1440
  }
 }
]
```

------

#### codec

编码：

| 值           | 说明 |
| ------------ | ---- |
| H264         | AVC  |
| H265         | HEVC |
| G711         | 语音 |
| MPEG-4 Audio | AAC  |

------

#### codecProps

视频属性：

| 字段    | 说明          |
| ------- | ------------- |
| width   | 宽            |
| height  | 高            |
| profile | 编码等级      |
| level   | H264/H265等级 |

例如：

```
{
"width":2560,
"height":1440
}
```

表示：

```
2560×1440
```

即：

```
2K摄像头
```

------

### 7. 当前观看用户 readers

结构：

```
"readers":
[
 {
  "type":"webRTCSession",
  "id":"xxxx"
 }
]
```

表示：

> 当前正在读取该视频的客户端

------

字段：

| 字段 | 说明     |
| ---- | -------- |
| type | 访问类型 |
| id   | 连接ID   |

------

常见：

| type          | 说明       |
| ------------- | ---------- |
| webRTCSession | 浏览器观看 |
| rtspSession   | RTSP客户端 |
| hlsMuxer      | HLS播放    |

------

### 8. 流量统计

#### 输入流量

```
"inboundBytes":29681480
```

表示：

MediaMTX收到的数据。

来源：

```
摄像头
 ↓
MediaMTX
```

------

#### 输出流量

```
"outboundBytes":74607920
```

表示：

MediaMTX发送的数据。

方向：

```
MediaMTX
 ↓
用户
```

------

#### 字段说明

| 字段          | 说明       |
| ------------- | ---------- |
| inboundBytes  | 输入字节数 |
| outboundBytes | 输出字节数 |
| bytesReceived | 收到字节   |
| bytesSent     | 发送字节   |

------

### 9. 错误统计

```
"inboundFramesInError":221
```

表示：

输入视频错误帧数量。

判断：

| 值       | 状态            |
| -------- | --------------- |
| 0        | 正常            |
| 持续增加 | 网络/摄像头异常 |

可能原因：

- RTSP丢包
- 摄像头编码异常
- 网络拥堵

| 字段    | 说明     |
| ------- | -------- |
| name    | 流名称   |
| state   | 状态     |
| source  | 来源     |
| readers | 观看人数 |

例如你的：

```
camera1
```

就是：

```
rtsp://服务器:8554/camera1
```

------

## 3. 查看单个摄像头

例如：

```
camera1
```

接口：

```
GET

/v3/paths/get/camera1
```

PowerShell：

```
curl `
http://127.0.0.1:9997/v3/paths/get/camera1
```

返回：

```
{
"name":"camera1",
"state":"ready",
"source":{
"type":"rtspSource",
"id":"xxx"
},
"tracks":[
"H264"
]
}
```

------

## 4. 查看 RTSP 连接

查看摄像头连接：

```
GET

/v3/rtspconns/list
```

例如：

```
curl http://127.0.0.1:9997/v3/rtspconns/list
```

返回：

```
{
"items":[
 {
  "id":"xxxx",
  "state":"read",
  "bytesReceived":123456
 }
]
}
```

可以监控：

- 摄像头是否断开
- 接收流量
- 连接数量

------

## 5. 查看 WebRTC 用户

你的浏览器观看：

```
http://server:8889/camera1
```

可以查询：

```
GET

/v3/webrtcsessions/list
```

返回：

```
{
"items":[
 {
  "id":"xxx",
  "path":"camera1"
 }
]
}
```

------

## 6. 动态添加摄像头

比如你的前端：

```
添加摄像头

名称:
camera2

地址:
rtsp://admin:123456@192.168.1.200
```

后台调用：

```
POST

/v3/config/paths/add/camera2
```

发送：

```
{
"source":
"rtsp://admin:123456@192.168.1.200:554/Streaming/Channels/101"
}
```

MediaMTX立即增加：

```
camera2
```

不需要手动修改 yml。

API支持路径配置的增删改查。

------

## 7. 删除摄像头

接口：

```
DELETE

/v3/config/paths/delete/camera2
```

效果：

```
camera2
```

消失。

------

## 8. 查看录像列表

如果开启录像：

```
record: yes
```

API：

```
GET

/v3/recordings/list
```

可以返回：

```
{
"items":[
 {
  "path":"camera1",
  "segments":10
 }
]
}
```

官方 API 支持录像查询和删除录像片段。

## 9. 注意一个问题：用户≠连接

MediaMTX只能知道：

```
连接数量
```

不能知道：

```
真实的人
```

例如：

一个用户打开：

```
Chrome标签页1
Chrome标签页2
手机
```

MediaMTX看到：

```
3个连接
```

实际上可能：

```
1个人
```

如果要统计真实登录用户，需要你的后台加：

```
用户系统
+
Token
+
WebSocket Session
```

例如：

```
张三
  |
  登录
  |
  播放camera1
  |
  WebRTC连接ID abc
```

你的数据库记录：

```
UserId | Camera | Session
--------------------------
1001   | 1号门  | abc123
1002   | 1号门  | def456
```

------

