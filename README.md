# Ean7 的技术博客

基于 [Hugo](https://gohugo.io/) 与 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 的个人站点源码。线上地址见 [`hugo.toml`](hugo.toml) 中的 `baseURL`（当前为 <https://ean7.top/>）；仓库亦可部署到 [GitHub Pages](https://pages.github.com/)。

## 站点特性

- 博客文章、分类、标签、项目展示、关于页
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

```bash
hugo server --buildDrafts
```

浏览器访问 <http://localhost:1313/>。

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

每篇文章使用**叶子包**：在 `content/posts/` 下新建文件夹，内含 `index.md` 与同目录图片，例如：

```text
content/posts/我的文章/
├── index.md
├── cover.png          # 可选
└── screenshot-1.png
```

Hugo 会将包内资源发布到文章 URL 路径下（如 `/posts/我的文章/`）。文件夹名中的中文、空格会按规则转成 URL（如 `HoloLens2` → `/posts/hololens2/`），本地预览时以终端或浏览器地址栏为准。

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

1. 在 `content/posts/` 新建目录并编写 `index.md`，图片放在同目录。
2. `hugo server --buildDrafts` 本地检查排版与链接。
3. 将 `draft` 设为 `false`。
4. （可选）`node scripts/fetch-post-pv.mjs` 更新阅读量数据。
5. `hugo --minify` 确认能成功构建。
6. 提交并推送；若已配置 GitHub Actions，等待部署完成。

更详细的 Hugo 用法可参考站内文章 [`content/posts/hugo/`](content/posts/hugo/)。

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

工作流会：检出代码（含子模块）→ 恢复 Git 时间戳 → 安装 Hugo Extended → `hugo --minify` → 将 `public/` 推送到 `gh-pages`。

若使用自定义域名，在仓库根目录添加 `CNAME` 并在 DNS 中指向 GitHub Pages；`baseURL` 需与线上一致。

## 目录说明

| 路径 | 说明 |
|------|------|
| `content/posts/` | 博客文章（建议每篇一个子目录 + `index.md`） |
| `content/projects/` | 项目页 |
| `content/about/` | 关于页 |
| `content/categories/`、`content/tags/` | 分类 / 标签列表页 |
| `content/search.md` | 搜索页 |
| `data/postpageviews.json` | 各文章阅读量快照，供首页「最热文章」排序（由脚本生成） |
| `layouts/` | 站点级模板覆盖（自定义首页、页眉页脚、分类标签样式等） |
| `layouts/_partials/` | 片段模板（如 `post_meta.html`、`extend_head.html`） |
| `scripts/fetch-post-pv.mjs` | 从不蒜子拉取阅读量并写入 `data/` |
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
| `layouts/projects/list.html` | 项目列表 |
| `layouts/categories/`、`layouts/tags/` | 分类 / 标签页样式 |

修改主题默认行为时，优先在 `layouts/` 覆盖，避免直接改 `themes/PaperMod`（子模块更新会覆盖本地改动）。

## 常见问题

| 现象 | 处理 |
|------|------|
| 本地写了 `<div>` / `<img>` 但页面上没有图 | Hugo 默认省略裸 HTML；改用 `{{< rawhtml >}}` 或 Markdown 图片语法 |
| 并排图 `src` 用 `./xxx.png` 不显示 | 在 `rawhtml` 内改用 `/posts/<slug>/xxx.png` 绝对路径 |
| 首页最热文章为空或很旧 | 运行 `node scripts/fetch-post-pv.mjs` 并提交 `data/postpageviews.json` |
| 推送后未自动部署 | 确认工作流在 `.github/workflows/`，且 Pages 源为 `gh-pages` |
| 子模块 / 主题缺失 | `git submodule update --init --recursive` |

## 许可证

若未另行声明，博客内容版权归作者所有；主题遵循 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 上游仓库的许可证。
