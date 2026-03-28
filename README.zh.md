# 7DTD Server Admin Frontend

基于 Vue 3 + Vite + Element Plus 的 7 Days to Die 服务器管理前端，集成 Pinia 状态、路由布局、统一主题、国际化与常用插件，支持仪表盘监控与封禁白名单管理。

[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-747bff.svg)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF.svg)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 简介

本项目在官方 `element-plus-vite-starter` 的基础上大量定制，围绕 7DTD 服务器运维场景提供仪表盘状态展示、封禁/白名单管理、多语言菜单、统一主题与中后台布局能力。

## 主要特性

- Vue 3 + Vite 7 + TypeScript，默认使用 pnpm 作为包管理器。
- Element Plus：通过 `unplugin-vue-components` 自动按需加载，主题与暗黑变量统一由 `useTheme` 组合式函数动态管理，无需手动维护 `src/styles/element/index.scss`。
- 统一布局：`layout/Header` + `layout/Sidebar` + `layout/Main` + `layout/NavTab` + `layout/MenuTree` 共同构成控制台级的导航架构。
- 路由：hash 路由配合 `Layout` 包裹，主入口支持本地化路径（如 `/:locale/dashboard`），内置 403/404/500 页面与多级菜单样例。
- 状态管理：Pinia 负责 `locale`、`nav-tab`、`keep-alive` 等中台行为，`composables/usePopup` / `useMenus` / `useTheme` 封装常用交互。
- 国际化：内置 `vue-i18n` + `@intlify/unplugin-vue-i18n`，支持本地推荐、浏览器语言检测与动态加载语言包。
- 插件链：包含 `@formkit/auto-animate`、`nprogress`、`mitt`、`dayjs`、`valibot` 等，配合 `ky`、`sweetalert2` 与 `@imengyu/vue3-context-menu` 构建实用工具。
- UnoCSS + Sass：`virtual:uno.css` + 自定义 `styles/index.scss` 实现原子类、暗黑 css-vars 与 Element Plus 主题的统一。

## 快速开始

```bash
pnpm install
pnpm dev
```

构建与检查：

```bash
pnpm build
pnpm preview
pnpm lint
pnpm typecheck
```

## 环境变量

项目会读取 `.env`、`.env.development`、`.env.production` 中的 Vite 环境变量。

核心 API 变量（`.env`）：

```dotenv
VITE_API_BASE_URL=/api/
VITE_API_TIMEOUT=30000

VITE_APP_PUBLIC_BASE_PATH=/
VITE_APP_VERSION=v1.0
```

开发环境变量（`.env.development`）：

```dotenv
VITE_DEV_BROWSER=chrome
VITE_DEV_OPEN_BROWSER=true
VITE_DEV_API_PROXY_TARGET=http://7dtdserver.local:8088
```

说明：

- `VITE_API_BASE_URL` 与 `VITE_API_TIMEOUT` 由 `src/utils/http.ts` 使用。
- `VITE_DEV_API_PROXY_TARGET` 由 `vite.config.ts` 中的 `/api` 代理使用。
- `VITE_DEV_OPEN_BROWSER` 控制 `pnpm dev` 时是否自动打开浏览器。

## 项目结构

```text
.
├─ public/                     # 公共静态资源
├─ src/
│  ├─ api/                     # 请求模块：auth/devices/gameServer
│  ├─ assets/                  # 图片和 SVG 资源
│  ├─ components/              # 可复用组件
│  ├─ composables/             # `useMenus`、`usePopup`、`useTheme`
│  ├─ layout/                  # Header/Sidebar/Main/NavTab/MenuTree
│  ├─ locales/                 # i18n 资源：constant.ts + en/zh-cn
│  ├─ plugins/                 # auto-animate、dayjs、element-plus、i18n、mitt、nprogress、pinia、valibot
│  ├─ router/                  # 路由定义与导航守卫
│  ├─ stores/                  # app、keepAlive、locale、navTab、recentActivity、userInfo
│  ├─ styles/                  # 全局样式与 Element Plus 主题覆盖
│  ├─ types/                   # global.d.ts、app.d.ts、api 响应类型
│  ├─ utils/                   # `markIcon` 等工具
│  ├─ views/                   # 403/404/500、Dashboard、BanWhitelist、Login、MultiLevelMenu
│  ├─ App.vue
│  └─ main.ts                   # 挂载 router、pinia、i18n、Element Plus 与 auto-animate
├─ eslint.config.ts
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```

## 路由与导航

路由集中定义在 `src/router/index.ts`，通过 `Layout` 包裹动态生成的侧边栏与导航标签。本地化路由组 `/:locale/*` 下包含 `dashboard` 与 `ban-whitelist` 业务模块，并通过 `markIcon` 生成 Iconify 图标。多级菜单示例位于 `views/MultiLevelMenu`，由 `components/MenuTree` 渲染。

## 国际化

国际化链路位于 `src/plugins/i18n.ts`，归纳了保存的语言偏好、浏览器语言探测与动态加载 `locales/{en,zh-cn}.json`。路由守卫会在每次跳转时检查 `/:locale` 中的语言是否受支持，并通过 Pinia 的 `locale` store 应用新的语言包。模板同时引入 `@valibot/i18n` 与 `valibot`，方便表单/校验逻辑根据语言输出。

## 主题与暗黑模式

主题与暗黑变量由 `composables/useTheme.ts` 统一管理，自动切换 Element Plus 相关 CSS 变量。Element Plus 暗黑 CSS 变量通过 `plugins/elementPlus.ts` 中的 `element-plus/theme-chalk/dark/css-vars.css` 引入，`Header/AppearanceModeToggler` 提供 UI 切换。

## 插件与工具

- `@formkit/auto-animate`：增强弹窗、导航标签等列表的动效。
- `nprogress`：路由守卫搭配 `router.beforeEach` 与 `afterEach` 控制页面加载进度条。
- `mitt`：全局事件总线（`plugins/mitt.ts`）便于跨组件通信。
- `dayjs`：在 `plugins/dayjs.ts` 中统一扩展插件与 locale 设置。
- `ky`：请求工具，配合 `src/api` 模块与 `src/utils/http.ts` 的封装统一处理接口调用。
- `sweetalert2`：高颜值弹窗示例存在于 `components/MessageBoxDemo.vue`。
- `UnoCSS`：通过 `uno.config.ts` 声明 typography preset、主题色、动画效果。
- `@imengyu/vue3-context-menu`：在视图中提供右键菜单支持（全局样式已引入）。

## 相关链接

- Vue 3：https://vuejs.org/
- Vite：https://vitejs.dev/
- Element Plus：https://element-plus.org/
- 7DTD Admin API（后端）：https://github.com/IceCoffee1024/7dtd-serveradmin-api
- 上游模板：https://github.com/element-plus/element-plus-vite-starter

## 许可证

[MIT License](LICENSE)

## 常见问题

### 如何修改别名（alias）？

`~/` 在 `vite.config.ts` 的 `resolve.alias` 中映射到了 `src/`，后续只需同步更新这一条即可。

### 如何修改开发端口？

`vite.config.ts` 默认不显式声明 `server.port`（Vite 默认 5173），如需固定端口可以在 `defineConfig` 里添加：

```ts
export default defineConfig({
  server: {
    port: 5173,
  },
});
```

### 主题变量如何维护？

Element Plus 相关变量由 `composables/useTheme.ts` 通过 CSS 变量同步到 `document.documentElement`，无需额外的 `src/styles/element/*` 文件。

暗黑 css-vars 由 `plugins/elementPlus.ts` 引入 `element-plus/theme-chalk/dark/css-vars.css`。
