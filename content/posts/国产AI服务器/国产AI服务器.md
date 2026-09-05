---
title: "国产AI服务器"
date: 2026-05-06
draft: true
tags: []
categories: []
---
# 开始

了解系统

```
(base) [kylin@localhost ~]$ uname -a
Linux localhost.localdomain 4.19.90-89.24.v2401.ky10.aarch64 #1 SMP Thu Jun 26 14:50:43 CST 2025 aarch64 aarch64 aarch64 GNU/Linux
(base) [kylin@localhost ~]$ cat /etc/os-release
NAME="Kylin Linux Advanced Server"
VERSION="V10 (Halberd)"
ID="kylin"
VERSION_ID="V10"
PRETTY_NAME="Kylin Linux Advanced Server V10 (Halberd)"
ANSI_COLOR="0;31"
(base) [kylin@localhost ~]$ which apt
which: no apt in (/home/kylin/miniconda3/bin:/home/kylin/miniconda3/condabin:/usr/local/corex-4.1.3/bin:/usr/local/corex-4.1.3/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin:/usr/local/inotify-tools/bin)
(base) [kylin@localhost ~]$ which yum
/usr/bin/yum
(base) [kylin@localhost ~]$ which dnf
/usr/bin/dnf
(base) [kylin@localhost ~]$ which dpkg
/usr/bin/dpkg
(base) [kylin@localhost ~]$ which rpm
/usr/bin/rpm
```

总结
>银河麒麟高级服务器操作系统 V10 的混合兼容环境
>
>更偏向 RHEL/CentOS/OpenEuler 系

## hardinfo

安装

```bash
sudo dnf update
sudo dnf install hardinfo
```

使用

```bash
hardinfo
```

![image-20260512170709480](./image-20260512170709480.png) 

```bash
$ watch -n 1 ixsmi
```

![image-20260512170907459](./image-20260512170907459.png)

### 总结

2颗飞腾S5000C/64处理器，8x32g内存条，4x智铠100 GPU,450g+3.5T硬盘

## GPU

规格如下

![image-20260512171916936](./image-20260512171916936.png) 

# 远程桌面

## TigerVNC 虚拟桌面

先看看有没有：

```
vncserver
```

如果有：

直接：

```
vncserver :1
```

------

如果没有

安装：

```
sudo yum install tigervnc-server
```

或者：

```
sudo dnf install tigervnc-server
```

------

然后启动：

```
vncserver :1
```

第一次会让设置密码。

## Windows 连接

安装RealVNC：

- [Download VNC Viewer by RealVNC®](https://www.realvnc.com/en/connect/download/viewer/)

连接：

```
服务器IP:5901
```

# 大语言模型

```bash
docker run --shm-size="32g" -it -v /usr/src:/usr/src -v /lib/modules:/lib/modules -v /dev:/dev -v /home:/home -v /data:/data --name=llm1 --privileged --cap-add=ALL --pid=host  --network=host zibo.harbor.iluvatar.com.cn:30000/saas/mr-bi150-4.1.3-aarch64-ubuntu20.04-py3.10-poc-llm-infer:v1.2.2 /bin/bash
```

拉取了一个官方提供的，适配当前显卡驱动版本的镜像到本地

# 开始项目

1、

新建一个docker容器，赋予最高权限

```bash
docker run --shm-size="32g" -it -v /usr/src:/usr/src -v /lib/modules:/lib/modules -v /dev:/dev -v /home:/home -v /data:/data --name=AI --privileged --cap-add=ALL --pid=host  --network=host corex:4.1.3 /bin/bash
```

2、挂载的是/home，克隆代码仓库后（更新），修改权限以便更改源代码

```bash
git fetch --all
git reset --hard origin/main
sudo chmod -R 777 /home/ai_system
```

3.ln -s /usr/local/bin/python3 /usr/bin/python

chmod +x start.sh







 yolo detect predict model=yolo26n.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' show=True  save=False imgsz=1920

yolo export model=./yolov8x-seg.onnx format=engine

python build_engine.py --model yolov8n.onnx --precision float16 --engine yolov8n.engine

python3 /home/DeepSparkInference-master/models/cv/object_detection/yolov8/ixrt/build_engine.py --model /home/export/yolov8x-seg-1920.onnx --precision float16 --engine yolov8x-seg-1920.engine

yolo detect predict model=yolov8x-seg.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' save=False  imgsz=1920  show=True  

yolo track model=yolov8x-seg.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' save=False   show=True  imgsz=1920 classes=1

rtsp://admin:scyzkj123456@112.44.251.105:554/h264/ch1/main/av_stream
yolo detect predict model=yolo11n.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' show=True  save=False

yolo detect predict model=phone_yolo11n.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' show=True  save=False imgsz=1920

yolo track model=yolo11x-seg.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' show=True  save=False imgsz=1920 device=cuda:0 half=True 

yolo track model=yolo11x-seg.pt source='./test.mp4' show=True  save=False imgsz=1920 device=cuda:0 half=True 

yolo track model=yolo11x-seg.pt source='./test.mp4' save=False imgsz=1920

yolo track model=yolov8.pt source='rtsp://admin:scyzkj123456@192.168.0.2:554/h264/ch1/main/av_stream' save=False imgsz=1920 device=cuda:0 half=True 



python3 offline_inference.py --model /home/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/ --max-tokens 256 -tp 2 --trust-remote-code --temperature 0.55 --max-model-len 2048

python3 offline_inference.py --model /home/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B/ --max-tokens 256 --max-model-len 2048 -tp 1 --temperature 0.55

python3 -m vllm.entrypoints.openai.api_server   --model /home/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B   --host 0.0.0.0   --port 8000

curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
        "model": "/home/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
        "messages": [{"role": "user", "content": "介绍一下牛顿第一定律"}]
      }'



python3 -m vllm.entrypoints.openai.api_server   --model /data/llm/Qwen3-0.6B --host 0.0.0.0   --port 8000

curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
        "model": "/home/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
        "messages": [{"role": "user", "content": "介绍一下牛顿第一定律"}]
      }'

python3 -m vllm.entrypoints.openai.api_server --model /home/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B --gpu-memory-utilization 0.9 --trust-remote-code --host 0.0.0.0 --port 8000 --max-num-batched-tokens 5120 --max-model-len 10240 --max_num_seqs 256 -tp 4


VLLM_ENFORCE_CUDA_GRAPH=1 NCCL_RING_BUFFER_SIZE=16M NCCL_MAX_NCHANNELS=4 NCCL_DEBUG=INFO python3 -m vllm.entrypoints.openai.api_server --model /data/llm/Qwen3-32B --gpu-memory-utilization 0.9 --trust-remote-code --host 0.0.0.0 --port 8000 --max-num-batched-tokens 10240 --max-model-len 10240 --max_num_seqs 256 -tp 4

VLLM_ENFORCE_CUDA_GRAPH=1 NCCL_RING_BUFFER_SIZE=16M NCCL_MAX_NCHANNELS=4 NCCL_DEBUG=INFO python3 -m vllm.entrypoints.openai.api_server --model /home/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B --gpu-memory-utilization 0.9 --trust-remote-code --host 0.0.0.0 --port 8000 --max-num-batched-tokens 10240 --max-model-len 10240 --max_num_seqs 256 -tp 4 --api-key scyzkj123456 --served-model-name deepseek

yolo solutions isegment classes=0

