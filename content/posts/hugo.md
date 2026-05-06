---
title: "初见Hugo"
date: 2026-05-06
draft: false
tags: ["Hugo", "PaperMod", "静态网站", "Markdown", "博客", "GitHub Pages", "Vercel"]
categories: ["技术", "教程"]
---

我的博客网站：[Ean7的技术博客](https://ean7.top/)

[The world's fastest framework for building websites](https://gohugo.io/)

# 快速开始

## 一、Hugo 是什么

Hugo 是一个用 Go 写的**静态网站生成器**，特点是：**速度极快、用 Markdown 写内容、无需后端**。

适合：博客 / 文档 / 官网 / 技术站

## 二、环境准备（必须）

### 1. 安装 Hugo

- Windows 推荐：直接下载官方二进制
- 或用包管理器（示例）

```
choco install hugo-extended   # Windows
brew install hugo             # macOS
```

># Linux 安装 Hugo
>
>#### 方法1：Snap（最简单，推荐）
>
>适用于 Ubuntu / Debian / 大多数发行版
>
>```
>sudo snap install hugo
>```
>
>👉 优点：
>
>- 一条命令
>- 自动更新
>- 官方维护
>
>#### 方法2：apt（Ubuntu / Debian）
>
>```
>sudo apt update
>sudo apt install hugo
>```
>
>👉 注意：
>
>- 版本通常**比较旧**
>- 可能缺少 `extended`（影响 SCSS）
>
>#### 方法3：下载官方二进制（最推荐生产环境）
>
>去官网（建议用这个方式）：
> 👉 Hugo
>
>下载 Linux 版本（extended）：
>
>```
>wget https://github.com/gohugoio/hugo/releases/latest/download/hugo_extended_*.deb
>sudo dpkg -i hugo_extended_*.deb
>```
>
>👉 或解压版：
>
>```
>tar -xvf hugo_extended_*.tar.gz
>sudo mv hugo /usr/local/bin/
>```

---



>#### Windows下安装安装 Chocolatey
>
>👉 用 **管理员 PowerShell**（不是普通窗口）
>
>打开：
> 👉 右键开始菜单 → Windows PowerShell（管理员）
>
>执行👇（官方安装命令）：
>
>```
>Set-ExecutionPolicy Bypass -Scope Process -Force; `
>[System.Net.ServicePointManager]::SecurityProtocol = `
>[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
>iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
>```

### 2. 验证

```
hugo version
```

👉 要求版本 ≥ 0.128 

## 三、创建网站

### 1️⃣ 创建项目

```
hugo new site myblog
cd myblog
```

👉 会生成目录结构：

```
content/
themes/
layouts/
static/
hugo.toml
```

------

### 2️⃣ 初始化 Git（可选但推荐）

```
git init
```

------

### 3️⃣ 添加主题

```
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

配置主题：

打开 `hugo.toml`，改成：

```
baseURL = "https://你的用户名.github.io/"
title = "你的技术博客"
theme = "PaperMod"

languageCode = "zh-cn"
```

👉 Hugo 本身不带 UI，**主题决定你网站长什么样**

------

### 4️⃣ 创建第一篇文章

```
hugo new content posts/hello.md
```

编辑文件：

```
---
title = "第一篇文章"
date = 2026-05-06
draft = true
---

# Hello Hugo
```

👉 默认是草稿，不会发布

------

### 5️⃣ 启动本地服务器

```
hugo server -D
```

打开浏览器：

```
http://localhost:1313
```

👉 `-D` = 显示草稿 

------

## 四、发布网站（生成静态文件）

```
hugo
```

👉 会生成：

```
/public
```

里面就是：

- HTML
- CSS
- JS

👉 可以直接部署到：

- GitHub Pages
- Nginx
- 云服务器

------

## 五、核心概念

### 1️⃣ 内容（Content）

```
content/posts/*.md
```

👉 用 Markdown 写文章

------

### 2️⃣ 主题（Themes）

```
themes/
```

👉 控制 UI 和布局

------

### 3️⃣ 配置（Config）

```
hugo.toml
```

常见：

```
baseURL = "https://example.com"
title = "My Blog"
theme = "ananke"
```

------

### 4️⃣ 构建原理（重点）

👉 Hugo流程：

```
Markdown → HTML → 静态网站
```

👉 没有：

- 数据库
- 后端
- PHP / Java

------

## 六、最小工作流

1.写文章

```
hugo new posts/xxx.md
```

2.本地预览

```
hugo server -D
```

3.发布

```
hugo
```

4.上传 `/public` 到服务器

# 主题配置

```toml
baseURL = "https://你的用户名.github.io/"
title = "你的技术博客"
theme = "PaperMod"
languageCode = "zh-cn"

[pagination]
  pagerSize = 10

[params]
  env = "production"

  ShowReadingTime = true
  ShowShareButtons = true
  ShowCodeCopyButtons = true
  ShowBreadCrumbs = true
  ShowToc = true

  defaultTheme = "auto"

  # 启用搜索
  fuseOpts = { isCaseSensitive = false, shouldSort = true }

# 必须：启用搜索
[outputs]
  home = ["HTML", "RSS", "JSON"]
```

**菜单配置**

```toml
[[menu.main]]
  name = "博客"
  url = "/posts/"
  weight = 1

[[menu.main]]
  name = "标签"
  url = "/tags/"
  weight = 2

[[menu.main]]
  name = "项目"
  url = "/projects/"
  weight = 3

[[menu.main]]
  name = "关于"
  url = "/about/"
  weight = 4
  
[[menu.main]]
  name = "🔍"
  url = "/search/"
  weight = 5
 
```



## 创建文章（PaperMod 标准写法）

```
hugo new posts/hello.md
```

内容：

```
---
title = "Hello PaperMod"
date = 2026-05-06
draft = false
tags = ["Hugo"]
categories = ["技术"]
---

# 第一篇文章
```

------

## 创建搜索页面

执行：

```
hugo new search.md
```

然后编辑 `content/search.md`：

```
---
title: "Search"
layout: "search"
summary: "search"
placeholder: "输入关键词..."
---
```

👉 这一行最关键：

```
layout: "search"
```

📌 没这个 → 搜索不会出现
 📌 这是 PaperMod 官方要求

## 本地运行

```
hugo server
```

打开：

```
http://localhost:1313
```

# 高级

`_index.md` 是 Hugo 里一个**非常关键但容易被忽略的文件**，一句话总结：

👉 **它是“列表页（section / 首页）的内容和配置文件”**



Hugo 里有两种页面：

| 类型   | 例子              | 文件        |
| ------ | ----------------- | ----------- |
| 单页   | 一篇文章          | `post.md`   |
| 列表页 | 博客列表 / 分类页 | `_index.md` |

👉 `_index.md` = **这个目录本身的页面**

------

## 核心作用

### 1️⃣ 控制“列表页面内容”

比如：

```
content/posts/_index.md
```

👉 对应页面：

```
/posts/
```

你可以写：

```
---
title = "博客"
description = "这里是我的技术文章"
---

欢迎来到我的博客 👋
```

👉 效果：

- `/posts/` 页面会显示这些内容
- 不是文章，而是**文章列表页的头部内容**

------

### 2️⃣ 控制首页

```
content/_index.md
```

👉 控制：

```
/
```

👉 也就是你的首页内容！

------

### 3️⃣ 控制分类页 / 标签页

比如：

```
content/tags/_index.md
content/categories/_index.md
```

👉 可以自定义：

- 标题
- 描述
- SEO

### 为什么必须有它？

如果没有 `_index.md`：

👉 Hugo 会：

- 自动生成列表页（但没有内容）
- 只能显示文章列表

👉 有了 `_index.md`：

- 可以加介绍
- 可以加自定义内容
- 可以影响 SEO

------

## 和 `index.md` 的区别（⚠️很多人搞错）

### `index.md`

👉 普通页面（single page）

```
content/about/index.md
```

👉 生成：

```
/about/
```

👉 是一篇页面

------

### `_index.md`

👉 列表页面（list page）

```
content/posts/_index.md
```

👉 生成：

```
/posts/
```

👉 是文章列表页

------

## 结构理解

```
content/
├── _index.md        ← 首页
├── posts/
│   ├── _index.md    ← 博客列表页
│   ├── a.md
│   ├── b.md
```

👉 页面对应：

| URL         | 来源              |
| ----------- | ----------------- |
| `/`         | `_index.md`       |
| `/posts/`   | `posts/_index.md` |
| `/posts/a/` | `a.md`            |

------

## PaperMod里怎么用

在 **PaperMod** 里：

### 首页推荐这样写：

```content/_index.md
---
title = "首页"
---

## 欢迎 👋
这是我的技术博客

- Hugo
- Docker
- IoT
```

👉 会显示在首页顶部

# 部署

直接采用vercel一键部署

vercel绑定github账号后，设置`Project Name`作为域名前缀后，`Build Command` 中 填写`hugo --minify`
`Output Directory` 中填写  `public`,还要指定环境变量`HUGO_VERSION`为`1.61.0`，点击部署即可。

## 国内访问

需要绑定一个域名，我购买的是阿里云的.top，240买了10年

然后在云解析中添加

```
记录类型： CNAME
主机记录： www
记录值： cname-china.vercel-dns.com 
```

和

```
记录类型： CNAME
主机记录： @
记录值： cname-china.vercel-dns.com 
```

(不带www前缀)

---

最后在vercel左侧的domains中添加对应额域名即可（等几分钟生效，显示`DNS Change Recommended`）