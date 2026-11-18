---
title: "CNC计算机数控加工模拟器"
categories: ["Web应用", "工具"]
date: 2026-11-18
description: "浏览器端 CNC 铣削 / 五轴模拟器：编写或加载 G-code，在 3D 场景中实时观看机床运动与材料去除。基于 Vue 3、TresJS / Three.js，纯前端运行，适合入门学习与 SF-260H 五轴可视化演示。"
---

# CNC计算机数控加工模拟器

项目地址：[GitHub - YQisme/CNC · GitHub](https://github.com/YQisme/CNC)

浏览器端 CNC 铣削 / 五轴模拟器：编写或加载 G-code，在 3D 场景中实时观看机床运动与材料去除。  
纯前端运行，无需安装、无需注册。

---

基于 **Vue 3**、**Vite**、**Element Plus**、**TresJS / Three.js**、**Pinia** 与 **TypeScript** 构建，以静态站点形式部署到 **GitHub Pages**。

适合 CNC 入门学习、G-code 预览，以及对佳时特 **SF-260H** 五轴摇篮机型的可视化演示。

---

## 功能特性

### 3D 机床与切削仿真

- 多机型目录：三轴 VMC、数控车床、四轴 HMC、龙门雕刻机，以及 **SF-260H 五轴**（摇篮 A/C）
- 高度图工件 + 按刀具几何的实时材料去除
- 刀路轨迹、钻孔孔位可视化、切屑效果
- 相机预设：等轴测 / 俯视 / 仰视 / 前视 / 右视 / 重置 / 聚焦
- 视图开关：刀路、网格、外壳、护罩、坐标轴；支持爆炸视图
- SF-260 模型可导出 **GLB / OBJ**（外壳与内部结构分组）

### 控制栏（DRO）

- 液晶风格坐标显示：X / Y / Z；五轴时额外显示 A / C
- 传输控制：复位、后退、播放 / 暂停、单段前进
- 机床模式：运行（完整切削）/ 干运行（只走刀）/ 机床锁定（仅预览刀路）
- 选择停止（M01）、跳过程序段（`/`）
- 循环速度 0.25×–10×，进给 / 快速 / 主轴倍率，时间轴 scrubber

### 程序、刀具与学习面板

侧栏标签页：

| 标签     | 内容                                                        |
| -------- | ----------------------------------------------------------- |
| 程序     | G-code 编辑器（语法高亮、当前行高亮、点击跳转）、示例与片段 |
| 程序库   | 保存 / 加载 / 导出 / 导入（localStorage）                   |
| 刀具     | 铣刀、钻头、铰刀、丝锥、车刀等工具库                        |
| 材料     | 铝、钢、不锈钢、钛、工程塑料等材料参数                      |
| 进给     | 进给与转速计算器                                            |
| 参考手册 | G / M / T / F / S / Z 等代码说明                            |
| 指南     | 快速上手、坐标系与编程技巧                                  |

当前内置规模（随代码库演进，以源码为准）：

- **35** 个示例程序（含 SF-260H 五轴姿态 / Sample 演示）
- **16** 个代码片段
- **28** 把刀具、**17** 种材料
- **60+** 条代码参考条目

---

## 快速上手

1. 打开应用后，在「程序」标签顶部选择示例，或直接在编辑器中粘贴自己的 G-code。
2. 按 `Space` 或点击播放：主轴转动，刀具沿路径运动，工件被切削。
3. 在 3D 视图中拖动环视、滚轮缩放；用右上角按钮切换刀路 / 网格 / 外壳等。
4. 用时间轴或 `←` / `→` 逐段单步，便于对照学习每一句代码。
5. 调整循环速度与倍率，观察对加工过程的影响。

最小示例：

```gcode
G21 G90 G17          ; mm, 绝对坐标, XY 平面
T1 M06                ; 换刀 1
M03 S2500             ; 主轴正转 2500 rpm
G00 Z5                ; 快速抬到安全高度
G00 X-20 Y-20
G01 Z-2 F50           ; 下刀
G01 X20 Y-20 F150     ; 直线切削
G00 Z5
M05 M30               ; 停主轴、程序结束
```

坐标系约定：零件零点在工件顶面中心；`Z=0` 为毛坯顶面，`Z` 负方向为切入深度。XY 移动前建议先 `G00 Z5` 抬刀。

---

## 支持的机床（目录）

| 机型           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| SF-260H 五轴   | 佳时特五轴坐标铣磨复合：XYZ + 摇篮 A/C，配套华中风格 Sample 演示 |
| 三轴 VMC       | 标准 Fanuc 风格立式加工中心                                  |
| 数控车床       | 斜床身车削中心（刀塔 / 卡盘场景）                            |
| 四轴 HMC       | 卧式加工中心 + 回转分度                                      |
| 数控龙门雕刻机 | 开放式高速雕刻 / 路由                                        |

SF-260H 与华中实机 Sample 的轴命名差异（实机多为 B/C，仿真按 A/C）见 [`docs/SF260H-SampleCode.md`](./docs/SF260H-SampleCode.md)。

---

## 本地开发

环境要求：**Node.js 18+**、**Yarn 1.x**。

```bash
# 克隆
git clone https://github.com/YQisme/CNC.git
cd CNC

# 安装依赖
yarn install

# 开发服务器 → http://localhost:3000
yarn dev

# 生产构建 → dist/
yarn build

# 本地预览构建结果
yarn preview

# 类型检查
yarn typecheck
```

Windows 可双击根目录 `start.bat`：自动检测 Node / Yarn，首次安装依赖后启动开发服务并打开浏览器。

路径别名：`@/` → `src/`。

GitHub Pages 项目页构建时会根据 `GITHUB_REPOSITORY` 自动设置 `base`；也可手动指定：

```bash
VITE_BASE_PATH="/CNC/" yarn build
```

---

## Docker 部署

无需本机安装 Node，用 Docker Compose 即可运行。

### 生产模式（推荐）

多阶段构建：Yarn 打包静态资源，再由 Nginx 托管。

```bash
# 构建并后台启动 → http://localhost:8080
docker compose up -d --build

# 查看日志 / 停止
docker compose logs -f web
docker compose down
```

自定义宿主机端口：

```bash
# Windows PowerShell
$env:CNC_PORT=9000; docker compose up -d --build

# Linux / macOS
CNC_PORT=9000 docker compose up -d --build
```

镜像内 `VITE_BASE_PATH=/`，站点挂在根路径；容器健康检查探测 `http://127.0.0.1/`。

### 开发模式（热更新）

源码挂载进容器，适合在 Docker 里跑 Vite HMR：

```bash
docker compose --profile dev up
# → http://localhost:3000
```

依赖缓存在命名卷 `cnc_node_modules` 中，避免覆盖宿主机 `node_modules`。停止：`Ctrl+C` 或 `docker compose --profile dev down`。

### 相关文件

| 文件                                         | 作用                                 |
| -------------------------------------------- | ------------------------------------ |
| [`Dockerfile`](./Dockerfile)                 | 多阶段构建（Node 构建 + Nginx 运行） |
| [`docker-compose.yml`](./docker-compose.yml) | `web` 生产服务 + `dev` 开发 profile  |
| [`docker/nginx.conf`](./docker/nginx.conf)   | SPA `try_files`、静态缓存、gzip      |
| [`.dockerignore`](./.dockerignore)           | 减小构建上下文                       |

---

## 键盘与鼠标

| 操作    | 说明           |
| ------- | -------------- |
| `Space` | 播放 / 暂停    |
| `→`     | 前进一个程序段 |
| `←`     | 后退一个程序段 |
| `R`     | 复位到起点     |
| 拖动    | 环视 3D 相机   |
| 滚轮    | 放大 / 缩小    |

---

## 项目结构

```
├── public/                     # 静态资源（logo、og-image、manifest 等）
├── docker/
│   └── nginx.conf              # 生产 Nginx（SPA 回退 / 缓存 / gzip）
├── docs/                       # 机型与 Sample 说明文档
├── examples/websocket/         # 独立 WebSocket 演示（不接入主应用）
├── src/
│   ├── main.ts                 # Vue + Pinia + Element Plus 入口
│   ├── App.vue                 # 顶栏与主布局
│   ├── stores/
│   │   ├── sim.ts              # 仿真播放、坐标、模式、当前程序
│   │   └── view.ts             # 相机预设、显隐开关、爆炸量
│   ├── components/cnc/
│   │   ├── CncLayout.vue       # 3D 视口 + 可拖拽侧栏
│   │   ├── ControlBar.vue      # DRO / 传输 / 模式 / 倍率
│   │   ├── CncScene.vue        # TresJS 场景根
│   │   ├── SceneContents.vue   # 机床、工件、刀路等场景内容
│   │   ├── GCodeEditor.vue
│   │   ├── ProgramPanel.vue / ProgramManager.vue
│   │   ├── ToolManager.vue / MaterialPanel.vue / FeedsCalculator.vue
│   │   ├── CodeReference.vue / GuidePanel.vue
│   │   └── machines/           # SF-260 外壳、摇篮、爆炸视图等
│   └── lib/cnc/                # 与 UI 解耦的纯逻辑
│       ├── parser.ts           # G-code 解析
│       ├── carve.ts            # 高度图切削 / 钻孔
│       ├── kinematics.ts       # 运动学
│       ├── examples.ts / snippets.ts
│       ├── tools.ts / materials.ts / feeds.ts
│       ├── reference.ts / programStore.ts
│       ├── exportModel.ts      # GLB / OBJ 导出
│       └── machines.ts         # 机床目录规格
├── Dockerfile                  # 生产镜像多阶段构建
├── docker-compose.yml          # web（生产）/ dev（开发）
├── .dockerignore
├── vite.config.ts
├── start.bat                   # Windows 一键启动
└── package.json
```

### 架构要点

- **状态**：仿真在 `stores/sim.ts`，视图在 `stores/view.ts`（Pinia）。
- **逻辑与渲染分离**：解析、切削、刀具/材料库放在 `src/lib/cnc/`，便于单测与复用；3D 仅通过组件消费状态。
- **3D**：TresJS（`@tresjs/core`、`@tresjs/cientos`）封装 Three.js；SF-260 外观与内部结构可分组导出。

---

## 技术栈

| 类别   | 选型                                        |
| ------ | ------------------------------------------- |
| 框架   | Vue 3 · Vite 6 · TypeScript 5               |
| UI     | Element Plus · Tailwind CSS 4 · Lucide 图标 |
| 3D     | TresJS · Three.js                           |
| 状态   | Pinia                                       |
| 包管理 | Yarn                                        |
| 容器   | Docker · Compose · Nginx                    |

---

## 部署到 GitHub Pages

推送到 `main` / `master` 后，[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 会：

1. 用 Yarn 安装依赖并执行 `yarn build`
2. 将 `dist/` 部署到 GitHub Pages

请在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

另有 `build-check`、CodeQL 等 CI 工作流，用于构建校验与安全扫描。

自托管或内网部署可改用上方 **Docker 部署**（Nginx 镜像），无需依赖 GitHub Pages。



