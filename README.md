# Ean7 的技术博客

基于 [Hugo](https://gohugo.io/) 与 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 的个人站点源码。线上地址见 [`hugo.toml`](hugo.toml) 中的 `baseURL`（当前为 <https://ean7.top/>）；仓库亦可部署到 [GitHub Pages](https://pages.github.com/)。

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

镜像会挂载当前目录并执行 `hugo server`，同样映射 `1313` 端口。

## 构建

```bash
hugo --minify
```

静态文件输出到 `public/`。

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

仓库中的 [`workflows/deploy.yml`](workflows/deploy.yml) 定义了在 `main` 分支推送时用 Hugo 构建并发布到 `gh-pages` 的流程。**GitHub Actions 只会识别 `.github/workflows/` 下的工作流文件**；若你希望推送后自动部署，请将该文件复制或移动到 `.github/workflows/deploy.yml`（或在该目录下新建等价配置）。

在仓库 **Settings → Pages** 中，将 Source 设为使用 `gh-pages` 分支（与工作流中的发布方式一致）。

## 目录说明

| 路径 | 说明 |
|------|------|
| `content/` | 文章与页面（Markdown） |
| `data/postpageviews.json` | 各文章阅读量快照，供首页「最热文章」排序（由脚本生成） |
| `layouts/` | 站点级模板覆盖（含自定义首页 `home.html`） |
| `scripts/fetch-post-pv.mjs` | 从不蒜子拉取阅读量并写入 `data/` |
| `static/` | 静态资源（图片等），构建时原样复制到站点根路径 |
| `hugo.toml` | Hugo 站点配置（含 `baseURL`、主题与菜单等） |
| `themes/PaperMod` | 主题（子模块） |
| `workflows/deploy.yml` | 部署工作流示例（需放到 `.github/workflows/` 才生效） |

## 许可证

若未另行声明，内容版权归作者所有；主题遵循其上游仓库的许可证。
