---
title: "代理服务器"
date: 2026-05-06
draft: true
tags: []
categories: []
---
# 说明

## **正向代理 vs 反向代理（附典型示例）**

---

### **1. 正向代理（Forward Proxy）**  
**角色**：代理 **客户端**，隐藏客户端的真实身份。  
**特点**：  
- 客户端主动配置代理（如浏览器设置）。  
- 服务器不知道真实的客户端是谁，只能看到代理的 IP。  

**典型示例**：  
1. **企业内网访问外网**  
   - 员工电脑 → 公司代理服务器 → 访问 Google  
   - **目的**：统一管控上网行为、过滤内容、记录日志。  

2. **科学上网（翻墙）**  
   - 你的电脑 → VPN/SSR 代理 → 访问 YouTube  
   - **目的**：绕过地域限制，隐藏真实 IP。  

3. **爬虫匿名请求**  
   - 爬虫程序 → 代理 IP 池 → 目标网站  
   - **目的**：避免被封禁真实 IP。  

**配置代码示例（Python Requests）**：  
```python
import requests

proxies = {
    "http": "http://10.10.1.10:3128",  # 公司代理地址
    "https": "http://10.10.1.10:3128",
}

response = requests.get("https://www.example.com", proxies=proxies)
print(response.text)
```

---

### **2. 反向代理（Reverse Proxy）**  
**角色**：代理 **服务器**，隐藏服务器的真实信息。  
**特点**：  
- 客户端无感知（无需配置），直接访问代理地址。  
- 服务器端部署，用于负载均衡、安全防护等。  

**典型示例**：  
1. **Nginx 负载均衡**  
   - 用户访问 `https://www.example.com` → Nginx 反向代理 → 分发请求到后端多台服务器（如 Server1、Server2）  
   - **目的**：提高并发能力，避免单点故障。  

2. **隐藏真实服务器**  
   - 用户访问 `https://api.company.com` → 反向代理 → 真实服务 `http://192.168.1.100:8080`  
   - **目的**：保护后端服务器 IP，防止直接暴露。  

3. **HTTPS 终止**  
   - 用户 HTTPS 请求 → 反向代理（处理 SSL 解密）→ HTTP 转发到内网服务器  
   - **目的**：集中管理证书，减轻后端计算压力。  

**Nginx 配置示例**：  
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend_servers;  # 转发到后端服务器组
        proxy_set_header Host $host;
    }
}

upstream backend_servers {
    server 192.168.1.101:8000;
    server 192.168.1.102:8000;
}
```

---

## **对比总结**
| 特性         | 正向代理                | 反向代理                  |
| ------------ | ----------------------- | ------------------------- |
| **代理对象** | 客户端                  | 服务器                    |
| **配置方**   | 客户端主动设置          | 服务端部署                |
| **隐藏目标** | 隐藏客户端 IP           | 隐藏服务器 IP             |
| **典型用途** | 翻墙、爬虫、企业管控    | 负载均衡、安全防护、CDN   |
| **常见工具** | Squid、Shadowsocks、VPN | Nginx、Apache、Cloudflare |

---

## **一句话理解**  
- **正向代理**：**“替客户端跑腿”**（如代购）。  
- **反向代理**：**“替服务器接客”**（如前台接待）。

# 快速入门

