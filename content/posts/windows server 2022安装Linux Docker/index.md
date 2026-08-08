---
title: "windows server 2022 安装 Linux Docker"
date: 2026-08-08
lastmod: 2026-08-08
draft: false
tags: ["Windows Server 2022", "Docker", "Hyper-V", "Ubuntu", "Linux"]
categories: ["技术", "教程"]
---

## 为什么不选择windows安装

TimescaleDB 的一些高级工具（例如 TimescaleDB Toolkit）在 Windows 上支持有限，官方建议某些场景使用 Docker/Linux。

| 项目               | Windows原生 | Ubuntu Docker |
| ------------------ | ----------- | ------------- |
| 安装               | ⭐⭐⭐         | ⭐⭐⭐⭐⭐         |
| 维护               | ⭐⭐⭐         | ⭐⭐⭐⭐          |
| 升级               | 稍麻烦      | 方便          |
| 备份迁移           | 一般        | 方便          |
| 工业服务器长期运行 | 可以        | 更常见        |

# 一、开启 Hyper-V

## 1. 打开服务器管理器

进入：

```
服务器管理器
 ↓
添加角色和功能
 ↓
下一步
```

选择：

```
基于角色或基于功能的安装
```

------

## 2. 选择服务器

选择当前 Windows Server。

------

## 3. 添加角色

勾选：

```
☑ Hyper-V
```

想·弹出：

```
需要添加管理工具？
```

选择：

```
添加功能
```

继续。

然后都默认设置，只是

### 默认存储

点击：

```
Hyper-V
 └── 默认存储
```

会看到两个路径：

#### 虚拟硬盘文件位置

默认一般：

```
C:\Users\Public\Documents\Hyper-V\Virtual Hard Disks
```

建议改：

例如：

```
D:\Hyper-V\Virtual Hard Disks
```

------

#### 虚拟机配置文件位置

默认：

```
C:\ProgramData\Microsoft\Windows\Hyper-V
```

建议改：

```
D:\Hyper-V\Virtual Machines
```

最后点击安装后重启

# 二、创建Ubuntu虚拟机

## 1. 打开Hyper-V管理器

在搜索框中搜索`Hyper-V管理器`

------

## 2. 创建虚拟交换机

右侧：

```
虚拟交换机管理器
```

选择：

```
外部
```

绑定你的物理网卡。（注意一定要选对宿主机上的网卡）

例如：

```
Intel Ethernet Adapter
```

保存。

------

## 3. 新建虚拟机

右侧：

```
新建
 ↓
虚拟机
```

------

名称：

例如：

```
ubuntu-docker
```

------

代数：

选择：

```
第二代
```

------

内存：

你的服务器128GB：

建议：

```
16384 MB
```

即：

16GB

后面可调整。

------

网络：

选择：

```
刚才创建的外部交换机
```

------

硬盘：

建议：

```
200GB
```

动态扩展即可。

------

安装：

选择：

```
从可启动的映像文件安装操作系统
```

挂载

例如：

([下载地址](https://releases.ubuntu.com/releases/22.04/ubuntu-22.04.5-desktop-amd64.iso))

```
ubuntu-22.04.5-desktop-amd64.iso
```

------

完成创建。

------

# 三、安装Ubuntu Server

启动虚拟机：

```
启动
```

进入安装界面。

> 如果报错
>
> ```
> The signed image's hash is not allowed (DB)
> ```
>
> 意思：
>
> > UEFI Secure Boot 拒绝加载当前 ISO 的启动文件。
>
> ------
>
> ## 解决方法
>
> ### 1. 关闭虚拟机
>
> 在 Hyper-V 管理器：
>
> 右键你的 Ubuntu 虚拟机：
>
> ```
> 关闭
> ```
>
> ------
>
> ### 2. 打开设置
>
> 右键：
>
> ```
> Ubuntu虚拟机
>   ↓
> 设置
> ```
>
> ------
>
> ### 3. 找到：
>
> ```
> 安全
> ```
>
> 取消：
>
> ```
> ☐ 启用安全启动
> ```



安装时一直默认，直到最后

设置用户名和密码

以及选择安装openssh

------

网络：

一般自动：

```
DHCP
```

安装后查看：

```
ip addr
```

例如：

```
192.168.0.20
```

记录。

------

创建用户：

例如：

```
用户名：
docker

密码：
******
```

------

建议勾选：

```
Install OpenSSH Server
```

这样以后SSH管理。

> Hyper-v的终端太难用了，使用其他的ssh远程终端

------

# 四、Ubuntu安装Docker

SSH进入Ubuntu：

> 先更换镜像源
>
> ```bash
> sudo nano /etc/apt/sources.list
> 
> deb http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
> deb http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
> deb http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
> deb http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
> ```

更新：

```
sudo apt update
sudo apt upgrade -y
```

------

### 1. 添加阿里云 Docker GPG 密钥

```
sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg \
| sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

检查：

```
ls -l /etc/apt/keyrings/docker.gpg
```

应该存在。

------

### 2. 添加 Docker 软件源

```
sudo tee /etc/apt/sources.list.d/docker.list <<EOF
deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu jammy stable
EOF
```

查看：

```
cat /etc/apt/sources.list.d/docker.list
```

应该显示：

```
deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.aliyun.com/docker-ce/linux/ubuntu jammy stable
```

------

### 3. 更新 apt

```
sudo apt update
```

正常应该看到：

```
Hit: https://mirrors.aliyun.com/docker-ce/linux/ubuntu jammy InRelease
```

如果看到：

```
Err: https://download.docker.com
```

说明旧源还存在，需要删除：

```
sudo rm -f /etc/apt/sources.list.d/docker.sources
```

或者：

```
ls /etc/apt/sources.list.d/
```

看看有没有其他 docker 源。

------

### 4. 安装 Docker

```
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

------

### 5. 启动 Docker 服务（建议加）

安装完成后：

```
sudo systemctl enable docker
sudo systemctl start docker
```

查看：

```
systemctl status docker
```

应该：

```
Active: active (running)
```

------

### 6. 测试 Docker

```
sudo docker run hello-world
```

成功会看到：

```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

>如果在 **拉取镜像阶段**失败：
>
>错误：
>
>```
>failed to resolve reference "docker.io/library/hello-world:latest"
>
>dial tcp 199.59.148.7:443: connect: connection refused
>```
>
>说明：
>
>- ✅ Docker daemon 正常运行
>- ✅ Docker 命令正常
>- ❌ 访问 Docker Hub (`registry-1.docker.io`) 被拒绝
>
>这是国内访问 Docker 官方服务的问题。
>
>------
>
>## 解决方法：配置 Docker 镜像加速器
>
>编辑 Docker 配置：
>
>```
>sudo mkdir -p /etc/docker
>sudo nano /etc/docker/daemon.json
>```
>
>填入：
>
>```
>{
>  "registry-mirrors": [
>    "https://docker.m.daocloud.io",
>    "https://dockerproxy.com",
>    "https://mirror.ccs.tencentyun.com"
>  ]
>}
>```
>
>保存。
>
>------
>
>重启 Docker：
>
>```
>sudo systemctl daemon-reload
>sudo systemctl restart docker
>```
>
>查看是否生效：
>
>```
>docker info
>```
>
>找到：
>
>```
>Registry Mirrors:
> https://docker.m.daocloud.io/
> https://dockerproxy.com/
> https://mirror.ccs.tencentyun.com/
>```
>
>------
>
>再次测试：
>
>```
>sudo docker run hello-world
>```
>
>正常会输出：
>
>```
>Hello from Docker!
>This message shows that your installation appears to be working correctly.
>```

------

### 7. （可选）免 sudo 使用 Docker

默认每次需要：

```
sudo docker ps
```

如果希望普通用户直接：

```
docker ps
```

执行：

```
sudo usermod -aG docker $USER
```

然后重新登录：

```
exit
```

重新 SSH 登录即可。

验证：

```
docker ps
```

