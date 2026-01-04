# Element Plus Template

基于 Vue 3 + Vite + Element Plus 的企业级中后台模版，集成 Pinia 状态、路由布局、统一主题、国际化与常用插件，便于快速搭建可扩展的控制台界面。

[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-747bff.svg)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF.svg)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 简介

本项目在官方 `element-plus-vite-starter` 的基础上大量定制，直接引入 Element Plus 组件、UnoCSS 原子类、国际化、暗黑主题、菜单栏与多级路由示例，并封装一套适用于中后台管理的布局与工具集。

## 主要特性

- Vue 3 + Vite 7 + TypeScript，默认使用 pnpm 作为包管理器。
- Element Plus：通过 `unplugin-vue-components` 自动按需加载，主题与暗黑变量统一由 `useTheme` 组合式函数动态管理，无需手动维护 `src/styles/element/index.scss`。
- 统一布局：`layout/Header` + `layout/Sidebar` + `layout/Main` + `layout/NavTab` + `layout/MenuTree` 共同构成控制台级的导航架构。
- 路由：hash 路由配合 `Layout` 包裹，主入口支持本地化路径（如 `/:locale/home`），内置 403/404/500 与多级菜单样例。
- 状态管理：Pinia 负责 `locale`、`nav-tab`、`keep-alive` 等中台行为，`composables/usePopup` / `useMenus` / `useTheme` 封装常用交互。
- 国际化：内置 `vue-i18n` + `@intlify/unplugin-vue-i18n`，支持本地推荐、浏览器语言检测与动态加载语言包。
- 插件链：包含 `@formkit/auto-animate`、`nprogress`、`mitt`、`dayjs`、`valibot` 等，配合 `axios`、`qs`、`sweetalert2` 与 `@imengyu/vue3-context-menu` 构建实用工具。
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

## 项目结构

```text
.
├─ public/                     # 公共静态资源
├─ src/
│  ├─ assets/                  # 图片、SVG 等资源
│  ├─ components/               # 组件示例：HelloWorld、Logos、MessageBoxDemo
│  │  ├─ ExceptionPage/         # 统一错误提示页面
│  │  └─ IconButton/            # 右上角图标按钮
│  ├─ composables/              # `useMenus`、`usePopup`、`useTheme`
│  ├─ layout/                   # 头部、侧边栏、主区域、导航标签、菜单树
│  │  ├─ Header/
│  │  │  ├─ AppearanceModeToggler/  # 暗黑切换按钮
│  │  │  ├─ FullscreenToggler/
│  │  │  ├─ LanguageSwitch/
│  │  │  ├─ Logo/
│  │  │  └─ MenuCollapse/
│  │  ├─ Sidebar/
│  │  ├─ MenuTree/
│  │  └─ NavTab/
│  ├─ locales/                  # `constant.ts` + en/zh-cn
│  ├─ plugins/                  # auto-animate、dayjs、element-plus、i18n、mitt、nprogress、pinia、valibot
│  ├─ router/                   # 路由定义、导航守卫、nprogress
│  ├─ stores/                   # app、keep-alive、locale、nav-tab
│  ├─ styles/                   # element 主题、全局样式、UnoCSS 补充
│  ├─ types/
│  ├─ utils/                    # `markIcon` 等工具
│  ├─ views/                    # 403/404/500、Home、MultiLevelMenu
│  ├─ App.vue
│  └─ main.ts                   # 挂载 router、pinia、i18n、Element Plus 与 auto-animate
├─ eslint.config.js
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```

## 路由与导航

路由集中定义在 `src/router/index.ts`，通过 `Layout` 包裹动态生成的侧边栏与导航标签。主路径 `/:locale/home` 会根据 `locale` 参数渲染多语言菜单，并通过 `markIcon` 生成 Iconify 图标。多级菜单示例位于 `views/MultiLevelMenu`，由 `components/MenuTree` 渲染。

## 国际化

国际化链路位于 `src/plugins/i18n.ts`，归纳了保存的语言偏好、浏览器语言探测与动态加载 `locales/{en,zh-cn}.json`。路由守卫会在每次跳转时检查 `/:locale` 中的语言是否受支持，并通过 Pinia 的 `locale` store 应用新的语言包。模板同时引入 `@valibot/i18n` 与 `valibot`，方便表单/校验逻辑根据语言输出。

## 主题与暗黑模式

主题与暗黑变量由 `composables/useTheme.ts` 统一管理，自动切换 Element Plus 相关 CSS 变量。Element Plus 暗黑 CSS 变量通过 `plugins/element-plus.ts` 中的 `element-plus/theme-chalk/dark/css-vars.css` 引入，`Header/AppearanceModeToggler` 提供 UI 切换。

## 插件与工具

- `@formkit/auto-animate`：增强弹窗、导航标签等列表的动效。
- `nprogress`：路由守卫搭配 `router.beforeEach` 与 `afterEach` 控制页面加载进度条。
- `mitt`：全局事件总线（`plugins/mitt.ts`）便于跨组件通信。
- `dayjs`：在 `plugins/dayjs.ts` 中统一扩展插件与 locale 设置。
- `axios` + `qs`：请求工具，配合 `utils` 或 Antd 组件可快速构建数据接口。
- `sweetalert2`：高颜值弹窗示例存在于 `components/MessageBoxDemo.vue`。
- `UnoCSS`：通过 `uno.config.ts` 声明 typography preset、主题色、动画效果。
- `@imengyu/vue3-context-menu`：在视图中提供右键菜单支持（全局样式已引入）。

## 相关链接

- Vue 3：https://vuejs.org/
- Vite：https://vitejs.dev/
- Element Plus：https://element-plus.org/
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

暗黑 css-vars 由 `plugins/element-plus.ts` 引入 `element-plus/theme-chalk/dark/css-vars.css`。
