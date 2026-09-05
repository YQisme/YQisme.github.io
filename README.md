# Ean7 的技术博客

基于 [Hugo](https://gohugo.io/) 与 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 的个人站点源码。线上地址见 [`hugo.toml`](hugo.toml) 中的 `baseURL`（当前为 <https://ean7.top/>）；仓库亦可部署到 [GitHub Pages](https://pages.github.com/)。

## 站点特性

- 博客文章、分类、标签、**项目展示**（列表 + 详情封面）、关于页
- 全文搜索（Fuse.js，需 Hugo Extended 且 `outputs.home` 含 `JSON`）
- 深色 / 浅色主题跟随系统（`defaultTheme = "auto"`）
- 文章目录、字数、阅读时间、上下篇导航、分享按钮
- 页脚站点 PV/UV、文章页阅读量（[不蒜子](https://busuanzi.ibruce.info/)）
- 首页「最热文章」：构建时按 `data/postpageviews.json` 排序（见下文脚本）
- 首页粒子背景等自定义样式（`layouts/_partials/extend_head.html`）

## 环境要求

| 用途 | 依赖 |
|------|------|
| 构建 / 本地预览 | [Hugo Extended](https://gohugo.io/installation/) |
| 本地预览（可选） | Docker（见下方） |
| 更新首页「最热文章」阅读量 | [Node.js](https://nodejs.org/) 18+（运行拉取脚本） |

主题以 Git 子模块形式位于 `themes/PaperMod`。

## 克隆仓库

```bash
git clone --recurse-submodules https://github.com/YQisme/YQisme.github.io.git
cd YQisme.github.io
```

若已克隆但未拉取子模块：

```bash
git submodule update --init --recursive
```

## 本地预览（Hugo）

Windows 推荐双击或在终端运行：

```bat
preview.bat
```

等价于先同步目录同名 `.md` → `index.md`，再执行 `hugo server`（**development 环境默认包含草稿**）。也可：

```bash
node scripts/hugo.mjs server
```

浏览器访问 <http://localhost:1313/>。草稿在列表中会标 `[草稿]`。正式部署（`hugo --minify`）仍不会发布草稿。

首页「最热文章」依赖 `data/postpageviews.json`。若该文件不存在或数据过旧，可先执行 [更新文章阅读量](#更新文章阅读量) 再启动预览。

## 本地预览（Docker）

```bash
docker compose up
```

镜像 [`hugomods/hugo:extended`](https://hub.docker.com/r/hugomods/hugo) 会挂载当前目录并执行 `hugo server --bind 0.0.0.0 --buildDrafts`，映射 `1313` 端口。

## 构建

```bash
hugo --minify
```

静态文件输出到 `public/`。

## 写文章

### 目录结构（Page Bundle）

每篇文章使用**叶子包**：在 `content/posts/` 下新建文件夹，正文为**与目录同名**的 Markdown（可含 `#`、空格、括号等），配图放同目录：

```text
content/posts/我的文章/
├── 我的文章.md
├── cover.png          # 可选，需在 front matter 中声明 cover.image
└── screenshot-1.png
```

Hugo 仍要求叶子包有 `index.md`。构建前脚本会把目录同名 `.md` 同步为 `index.md`（生成文件已 gitignore，勿手改）：

```bash
node scripts/ensure-index.mjs                # 仅同步 index.md
node scripts/hugo.mjs server --buildDrafts   # 先同步再 hugo（推荐）
```

直接跑 `hugo server` 前需先执行一次 `ensure-index`，否则看不到文章。CI 部署前也会自动执行。

Hugo 会将包内资源发布到文章 URL 路径下（如 `/posts/我的文章/`）。文件夹名中的中文、空格会按规则转成 URL（如 `HoloLens2` → `/posts/hololens2/`），本地预览时以终端或浏览器地址栏为准。

**封面图**（详情页顶部大图，PaperMod 提供）在同目录放图后，于正文 front matter 中声明文件名（不要写 `./` 前缀）：

```yaml
cover:
  image: cover.png
```

### Front Matter 示例

```yaml
---
title: "文章标题"
date: 2026-05-22
draft: false
tags: ["标签1", "标签2"]
categories: ["技术", "随笔"]
---
```

- `draft: true` 时默认不会出现在正式构建中；本地加 `--buildDrafts` 可预览草稿。
- `lastmod` 可由 Git / 文件修改时间自动推断（见 `hugo.toml` 中 `[frontmatter]`）。

### 插入图片

**单张**（推荐，路径由 Hugo 自动处理）：

```markdown
![说明文字](./screenshot.png)
```

**左右并排两张**：Hugo 默认会剥离 Markdown 里的裸 HTML，需用 PaperMod 自带的 `rawhtml` shortcode，图片 `src` 使用**站点绝对路径**（将 `文章slug` 换成该文实际 URL 段，如 `hololens2`）：

```markdown
{{< rawhtml >}}
<div style="display: flex; gap: 1rem; align-items: flex-start;">
  <img src="/posts/文章slug/图1.png" alt="图1" style="flex: 1; min-width: 0; width: 50%; height: auto;" loading="lazy">
  <img src="/posts/文章slug/图2.png" alt="图2" style="flex: 1; min-width: 0; width: 50%; height: auto;" loading="lazy">
</div>
{{< /rawhtml >}}
```

本地 `hugo server` 预览无误后再提交。若希望全文可直接写 HTML，可在 `hugo.toml` 增加 `[markup.goldmark.renderer] unsafe = true`（影响全站，一般不必）。

### 发布新文章建议流程

1. 在 `content/posts/` 新建目录，编写与目录同名的 `.md`，图片放在同目录。
2. `node scripts/hugo.mjs server --buildDrafts` 本地检查排版与链接。
3. 将 `draft` 设为 `false`。
4. （可选）`node scripts/fetch-post-pv.mjs` 更新阅读量数据。
5. `hugo --minify` 确认能成功构建。
6. 提交并推送；若已配置 GitHub Actions，等待部署完成。

更详细的 Hugo 用法可参考站内文章 [`content/posts/hugo/`](content/posts/hugo/)。

## 写项目

项目内容放在 `content/projects/`。列表页使用自定义布局 [`layouts/projects/list.html`](layouts/projects/list.html)（网格卡片）；首页「项目」区块会展示最近 6 个项目（[`layouts/_default/home.html`](layouts/_default/home.html)）。二者通过 [`layouts/_partials/project_thumb.html`](layouts/_partials/project_thumb.html) 解析缩略图。

### 推荐：Page Bundle（与博客相同）

```text
content/projects/我的项目/
├── 我的项目.md
└── image-20260528101948221.png
```

正文 front matter 示例：

```yaml
---
title: "我的项目"
date: 2026-05-28
cover:
  image: image-20260528101948221.png
---
```

- **详情页**：PaperMod 的 `cover.html` 读取 `cover.image`，从 page bundle 匹配图片并生成响应式封面。
- **列表 / 首页卡片**：`project_thumb.html` 优先从 bundle 取图；若无 bundle，则把 `cover.image` 或旧字段 `image` 拼到该页 `RelPermalink` 下。

只需写 **`cover.image` 一次**，不必再重复 `image:`。

### 单文件 + 站点静态图（旧写法仍可用）

```text
content/projects/proj1.md
static/images/demo.jpg
```

```yaml
---
title: "工业 IoT 平台"
date: 2026-05-06
image: "/images/demo.jpg"
---
```

`image` 为以 `/` 开头的站点根路径时，列表与首页直接使用该 URL。新项目更推荐 bundle + `cover.image`。

### 发布新项目建议流程

1. 在 `content/projects/` 新建目录，编写与目录同名的 `.md`，封面与配图放在同目录。
2. `node scripts/hugo.mjs server --buildDrafts` 检查 `/projects/` 列表卡片与项目详情页封面。
3. 确认 `content/projects/_index.md` 的 `layout: "projects"` 未被改动（用于列表布局）。
4. 提交并推送。

## 更新文章阅读量

首页 **最热文章** 在 Hugo **构建时** 根据本地数据排序，访问者浏览器不会再去拉不蒜子接口。数据由脚本从不蒜子 API 批量获取后写入 `data/postpageviews.json`。

在仓库根目录执行：

```bash
node scripts/fetch-post-pv.mjs
```

脚本会：

1. 执行 `hugo list all`，列出 `content/posts/` 下**已发布**的文章（跳过 `draft: true`）；
2. 以每篇文章的 `permalink` 作为 `Referer`，请求不蒜子 JSONP 接口，解析 `page_pv`；
3. 将结果写入 `data/postpageviews.json`（含 `updatedAt`、各文 `permalink` / `rel` / `title` / `pv`）。

**建议**：发布新文章或希望排行榜更新时，先跑脚本再构建/提交；将 `data/postpageviews.json` 纳入版本库，部署产物即带最新排序。

> 文章页底部的「阅读量」仍由不蒜子在前端实时显示（`layouts/_partials/post_meta.html`），与首页最热列表的数据源相互独立。

### 在 CI 中自动拉取（可选）

若希望每次部署前刷新阅读量，可在 GitHub Actions 的 `hugo` 构建步骤前增加 Node 与脚本，例如：

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Fetch post page views
  run: node scripts/fetch-post-pv.mjs
```

注意：不蒜子对请求频率有限制，脚本已做并发与间隔控制。若某篇文章返回 **HTTP 503**，且 `data/postpageviews.json` 中已有该文记录，则**保留上次的 `pv`**；其他错误仍记为 `0`。CI 偶发失败时可重新运行工作流或本地补跑脚本。

## 部署

仓库中的 [`workflows/deploy.yml`](workflows/deploy.yml) 定义了在 `main` 分支推送时用 Hugo 构建并发布到 `gh-pages` 的流程。

> **注意**：GitHub Actions **只会**执行 `.github/workflows/` 下的工作流。若推送后未自动部署，请将该文件复制到 `.github/workflows/deploy.yml`：
>
> ```bash
> mkdir -p .github/workflows
> cp workflows/deploy.yml .github/workflows/deploy.yml
> ```

### 启用 GitHub Pages

1. 仓库 **Settings → Actions → General**：Workflow permissions 允许读写（`GITHUB_TOKEN` 需能推 `gh-pages`）。
2. **Settings → Pages**：Source 选择 **Deploy from a branch**，Branch 选 `gh-pages`，目录 `/ (root)`。
3. 推送 `main` 后，在 Actions 页查看 **Deploy site** 是否成功。

工作流会：检出代码（含子模块）→ 恢复 Git 时间戳 → 安装 Hugo Extended → `node scripts/ensure-index.mjs` → `hugo --minify` → 将 `public/` 推送到 `gh-pages`。

若使用自定义域名，在仓库根目录添加 `CNAME` 并在 DNS 中指向 GitHub Pages；`baseURL` 需与线上一致。

## 目录说明

| 路径 | 说明 |
|------|------|
| `content/posts/` | 博客文章（子目录 + 与目录同名 `.md`） |
| `content/projects/` | 项目页（子目录 + 与目录同名 `.md`；亦支持单文件 `.md`） |
| `content/projects/_index.md` | 项目列表页（`layout: projects`） |
| `content/about/` | 关于页 |
| `content/categories/`、`content/tags/` | 分类 / 标签列表页 |
| `content/search.md` | 搜索页 |
| `data/postpageviews.json` | 各文章阅读量快照，供首页「最热文章」排序（由脚本生成） |
| `layouts/` | 站点级模板覆盖（自定义首页、页眉页脚、分类标签样式等） |
| `layouts/_partials/` | 片段模板（如 `post_meta.html`、`extend_head.html`） |
| `scripts/fetch-post-pv.mjs` | 从不蒜子拉取阅读量并写入 `data/` |
| `scripts/ensure-index.mjs` | 将目录同名 `.md` 同步为 Hugo 所需的 `index.md` |
| `scripts/hugo.mjs` | 先跑 `ensure-index` 再调用 `hugo` |
| `preview.bat` | Windows 一键本地预览（调用 `scripts/hugo.mjs server --buildDrafts`） |
| `static/` | 静态资源（如 `static/images/avatar.jpg`），构建时复制到站点根路径 |
| `hugo.toml` | Hugo 站点配置（`baseURL`、主题、菜单、搜索输出等） |
| `themes/PaperMod` | 主题（Git 子模块） |
| `docker-compose.yml` | 本地 Docker 预览 |
| `workflows/deploy.yml` | 部署工作流示例（需复制到 `.github/workflows/` 才生效） |

### 自定义布局（相对 PaperMod 的改动）

| 文件 | 作用 |
|------|------|
| `layouts/_default/home.html` | 首页布局（最热文章、粒子背景等） |
| `layouts/_partials/extend_head.html` | 额外 CSS / 脚本 |
| `layouts/_partials/post_meta.html` | 文章元信息与不蒜子阅读量 |
| `layouts/_partials/footer.html` | 页脚与站点统计 |
| `layouts/projects/list.html` | 项目列表（网格卡片） |
| `layouts/_partials/project_thumb.html` | 项目列表 / 首页项目卡片缩略图（bundle、`cover.image`、`image`） |
| `layouts/categories/`、`layouts/tags/` | 分类 / 标签页样式 |

修改主题默认行为时，优先在 `layouts/` 覆盖，避免直接改 `themes/PaperMod`（子模块更新会覆盖本地改动）。

## 常见问题

| 现象 | 处理 |
|------|------|
| 本地写了 `<div>` / `<img>` 但页面上没有图 | Hugo 默认省略裸 HTML；改用 `{{< rawhtml >}}` 或 Markdown 图片语法 |
| 并排图 `src` 用 `./xxx.png` 不显示 | 在 `rawhtml` 内改用 `/posts/<slug>/xxx.png` 绝对路径 |
| 项目 / 文章封面不显示 | 详情页用 `cover.image`（不是顶层 `image`）；bundle 内只写文件名，勿用 `./`；列表依赖 `project_thumb.html`，需 Extended 构建 |
| 项目列表有图、详情无封面 | 只写了 `image` 未写 `cover.image` 时，补上 `cover:` 块 |
| 首页最热文章为空或很旧 | 运行 `node scripts/fetch-post-pv.mjs` 并提交 `data/postpageviews.json` |
| 推送后未自动部署 | 确认工作流在 `.github/workflows/`，且 Pages 源为 `gh-pages` |
| 子模块 / 主题缺失 | `git submodule update --init --recursive` |
| `resources/_gen/` 被提交或冲突 | 为 Hugo 生成的图片缓存，建议加入 `.gitignore`，本地构建会自动再生 |

## 许可证

若未另行声明，博客内容版权归作者所有；主题遵循 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 上游仓库的许可证。
