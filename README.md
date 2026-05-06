# Ean7 的技术博客

基于 [Hugo](https://gohugo.io/) 与 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 的个人站点源码，部署在 [GitHub Pages](https://pages.github.com/)（`https://YQisme.github.io/`）。

## 环境要求

- [Hugo Extended](https://gohugo.io/installation/)（构建站点需要 Extended 版以支持 SCSS 等特性）
- 或 Docker（见下方本地预览）

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

## 本地预览（Docker）

```bash
docker compose up
```

镜像会挂载当前目录并执行 `hugo server`，同样映射 `1313` 端口。

## 构建

```bash
hugo --minify
```

静态文件输出到 `public/`。

## 部署

仓库中的 [`workflows/deploy.yml`](workflows/deploy.yml) 定义了在 `main` 分支推送时用 Hugo 构建并发布到 `gh-pages` 的流程。**GitHub Actions 只会识别 `.github/workflows/` 下的工作流文件**；若你希望推送后自动部署，请将该文件放到 `.github/workflows/deploy.yml`（或在该目录下新建等价配置）。

在仓库 **Settings → Pages** 中，将 Source 设为使用 `gh-pages` 分支（与工作流中的发布方式一致）。

## 目录说明

| 路径 | 说明 |
|------|------|
| `content/` | 文章与页面（Markdown） |
| `layouts/` | 站点级模板覆盖 |
| `static/` | 静态资源（图片等），构建时原样复制到站点根路径 |
| `hugo.toml` | Hugo 站点配置 |
| `themes/PaperMod` | 主题（子模块） |

## 许可证

若未另行声明，内容版权归作者所有；主题遵循其上游仓库的许可证。
