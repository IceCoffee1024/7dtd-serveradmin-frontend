# 7DTD Server Admin Frontend

基于 Vue 3 + Vite + Element Plus 的 7 Days to Die 服务器管理前端。项目面向 7DTD 服务器运维场景，提供本地化仪表盘、玩家工具、聊天管理、经济系统、传送工具、任务调度、备份、审计日志与应用设置等中后台能力。

[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-747bff.svg)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF.svg)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 主要特性

- Vue 3.5、Vite 8、TypeScript、pnpm 11、Element Plus 2、Pinia、Vue Router 5、Vue I18n 11。
- 完整控制台布局：顶部栏、侧边栏、导航标签、Footer、暗黑模式、主题配置，以及 `/#/zh-cn/dashboard` 这样的本地化 hash 路由。
- 全站统一视觉系统：卡片、表格、弹窗、搜索面板、Tabs、表单、空状态、Element Plus 暗黑变量与焦点态样式。
- 仪表盘监控：服务器状态、系统指标、图表、快捷操作、最近活动与系统信息。
- 玩家与地图工具：在线/历史玩家、玩家详情/背包/技能弹窗、GPS 地图、物品/方块、服务器配置与控制台。
- 游戏功能模块：实时聊天、历史聊天、聊天设置、彩色聊天、游戏公告、玩家传送、经济系统、成就、在线时长奖励、投票重启、投票踢人。
- 运维与系统模块：服务器重启、任务调度、备份管理、审计日志、游戏事件日志、权限管理、黑白名单、模组管理、应用设置与 Swagger/API 文档。
- Hey API 自动生成 SDK、类型、Valibot schema 与 Pinia Colada 查询/变更配置。
- 集成 OpenLayers 地图、Chart.js 图表、右键菜单、nprogress、mitt 事件总线、dayjs、auto-animate、UnoCSS 与 Sass。

## 快速开始

```bash
pnpm install
pnpm dev
```

构建与检查：

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

接口代码生成：

```bash
pnpm api:gen
pnpm api:check
```

## 环境变量

项目会读取 `.env`、`.env.development`、`.env.production` 中的 Vite 环境变量。

运行时变量（`.env`）：

```dotenv
VITE_OPENAPI_BASE_URL=

VITE_APP_PUBLIC_BASE_PATH=/
VITE_APP_VERSION=v1.0

VITE_DEFAULT_USERNAME=admin
VITE_DEFAULT_PASSWORD=password
```

开发环境变量（`.env.development`）：

```dotenv
BROWSER=chrome

OPENAPI_INPUT=http://7dtdserver.local:8088/swagger/v1/swagger.json
VITE_DEV_API_PROXY_TARGET=http://7dtdserver.local:8088
```

说明：

- `VITE_OPENAPI_BASE_URL` 是运行时后端 origin；同源部署保持为空，跨域部署填写后端地址。
- `VITE_APP_PUBLIC_BASE_PATH` 会传给 Vite 的 `base`，部署到子路径时需要配置。
- `VITE_APP_VERSION` 会和项目名称一起展示在登录页。
- `VITE_DEFAULT_USERNAME` 与 `VITE_DEFAULT_PASSWORD` 用于记录默认/演示登录账号（`admin` / `password`）。当前登录页不会自动填充，也不会直接读取这两个变量。
- 不要把真实生产密钥或真实密码放进任何 `VITE_*` 变量。Vite 会把这些变量暴露给浏览器端代码。
- `BROWSER=chrome` 用于本地开发时让 Vite 打开 Chrome。
- `OPENAPI_INPUT` 由 `pnpm api:gen` 读取，用于从 Swagger/OpenAPI 文档生成接口代码。
- `VITE_DEV_API_PROXY_TARGET` 由 `vite.config.ts` 的 `/api` 与 `/swagger` 代理使用。

## 项目结构

```text
.
├─ public/                     # 公共静态资源
├─ src/
│  ├─ api/                     # 生成 API client 的全局配置
│  ├─ assets/                  # 图片与自定义 SVG 图标
│  ├─ components/              # 共享组件：MyTable、MyForm、弹窗、图表、按钮
│  ├─ composables/             # 菜单、弹窗、表格、主题、命令历史、表单辅助
│  ├─ generated/api/           # Hey API 生成的 SDK、类型、schema、Pinia Colada options
│  ├─ layout/                  # Header、Sidebar、Main、NavTab、Footer、MenuTree
│  ├─ locales/                 # en 与 zh-cn 国际化资源
│  ├─ plugins/                 # Element Plus、i18n、pinia、mitt、dayjs、nprogress、valibot
│  ├─ queries/                 # 查询失效、分页获取与业务查询辅助
│  ├─ router/                  # 路由定义与导航守卫
│  ├─ stores/                  # app、locale、userInfo、navTab、keepAlive、gameEvent、recentActivity
│  ├─ styles/                  # 全局样式、CSS 变量、Element Plus 覆盖
│  ├─ types/                   # 全局类型声明
│  ├─ utils/                   # 格式化、图标、资源、表格等工具
│  ├─ views/                   # 业务页面与错误页
│  ├─ App.vue
│  └─ main.ts
├─ eslint.config.ts
├─ openapi-ts.config.ts
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```

## 主要路由

路由集中定义在 `src/router/index.ts`。需要登录的页面位于 `/:locale/` 下，并由共享 `Layout` 渲染。

- 监控：仪表盘、玩家列表、GPS 地图。
- 游戏功能：实时聊天、历史聊天、聊天设置、彩色聊天、经济系统、物品/方块、游戏公告、玩家传送、投票重启、投票踢人、成就系统、在线时长奖励。
- 服务器管理：服务器配置、黑白名单、权限管理、模组管理。
- 运维操作：控制台、服务器重启、任务调度、备份管理。
- 系统：审计日志、游戏事件日志、应用设置、API 文档。

## 功能文档

- [Discord 集成配置与验证](docs/discord-integration.md)：Webhook、Bot、频道分流、代理、Slash 命令、命令安全边界与排障清单。

## 布局与样式

项目使用统一控制台布局。表格密集页面会在合适位置固定页面主体高度，让表格 body 内部滚动，同时保持页面 Tabs、搜索区域与工具栏可见。Footer 采用正常文档流：内容不足时贴近底部，内容足够时自然排列在 main 内容之后。

全局视觉样式集中在 `src/styles/index.scss` 与共享组件中：

- `MyTable` 负责服务端分页、搜索表单、列选择、右键菜单、批量操作、表格内部滚动与 CSV 导出。
- `MyForm` 负责配置式表单、校验、响应式网格、清晰焦点态与 Element Plus 表单控件样式。
- `MyCard`、`MyDialog`、`IconButton`、`LineChart` 与玩家相关弹窗提供统一的视觉模式。

## 国际化

国际化链路位于 `src/plugins/i18n.ts`，负责语言偏好保存、浏览器语言探测，以及加载 `src/locales/en.json` 和 `src/locales/zh-cn.json`。路由守卫会校验受支持的 locale，并同步 Pinia 的 `locale` store。

## 主题与暗黑模式

`composables/useTheme.ts` 负责保存主题设置，并把 Element Plus CSS 变量同步到 `document.documentElement`。Element Plus 暗黑变量在 `src/plugins/elementPlus.ts` 中引入，顶部栏提供主题模式、主题色、灰度、色弱、布局与显示项等外观控制。

## API 层

`@hey-api/openapi-ts` 会根据 `OPENAPI_INPUT` 在 `src/generated/api/` 下生成代码。生成的 client 由 `src/api/generatedClient.ts` 配置，使用 `VITE_OPENAPI_BASE_URL`，并接入认证 token 处理。业务模块通过生成的 Pinia Colada helpers 发起查询与变更。

## 相关链接

- Vue 3：https://vuejs.org/
- Vite：https://vitejs.dev/
- Element Plus：https://element-plus.org/
- 7DTD Admin API 后端：https://github.com/IceCoffee1024/7dtd-serveradmin-api
- 上游模板：https://github.com/element-plus/element-plus-vite-starter

## 许可证

[MIT License](LICENSE)
