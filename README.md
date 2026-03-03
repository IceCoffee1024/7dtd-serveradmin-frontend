# 7DTD Server Admin Frontend

A Vue 3 + Vite + Element Plus admin frontend for 7 Days to Die server operations, including dashboard monitoring, ban/whitelist management, locale-aware routing, and theme customization.

![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)
![Vite](https://img.shields.io/badge/Vite-7.x-747bff.svg)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## Key Features

- Vue 3 + Vite 7 + TypeScript with pnpm as the package manager.
- Element Plus: component auto-import via `unplugin-vue-components` while `useTheme` synchronizes Element Plus CSS vars and dark-mode palette instead of a static `src/styles/element/index.scss`.
- Unified layout: `layout/Header`, `layout/Sidebar`, `layout/Main`, `layout/NavTab`, and `layout/MenuTree` compose the console navigation framework.
- Routing: hash mode routes are wrapped by `Layout`, support localized entry points like `/:locale/dashboard`, and include 403/404/500 pages plus multi-level menu demos.
- State: Pinia stores manage `locale`, `nav-tab`, `keep-alive` behaviors while `composables/usePopup`, `useMenus`, and `useTheme` encapsulate UI concerns.
- Internationalization: `vue-i18n` with `@intlify/unplugin-vue-i18n`, browser language detection, persisted preference, and runtime loading of `locales/en.json` and `locales/zh-cn.json`.
- Plugin suite: auto-animate, nprogress, mitt, dayjs, valibot, axios, qs, sweetalert2, and @imengyu/vue3-context-menu provide a production-ready toolbox.
- UnoCSS + Sass: `virtual:uno.css` plus `src/styles/index.scss` cover atomic utilities, dark css vars, and Element Plus theme overrides.

## Quick Start

```bash
pnpm install
pnpm dev
```

Build & checks:

```bash
pnpm build
pnpm preview
pnpm lint
pnpm typecheck
```

## Environment Variables

The project reads Vite env variables from `.env`, `.env.development`, and `.env.production`.

Core API variables (`.env`):

```dotenv
VITE_API_BASE_URL=/api/
VITE_API_TIMEOUT=30000

VITE_APP_PUBLIC_BASE_PATH=/
VITE_APP_VERSION=v1.0
```

Development variables (`.env.development`):

```dotenv
VITE_DEV_BROWSER=chrome
VITE_DEV_OPEN_BROWSER=true
VITE_DEV_API_PROXY_TARGET=http://7dtdserver.local:8088
```

Notes:

- `VITE_API_BASE_URL` and `VITE_API_TIMEOUT` are consumed by `src/utils/http.ts`.
- `VITE_DEV_API_PROXY_TARGET` is consumed by the Vite proxy in `vite.config.ts` for `/api` forwarding.
- `VITE_DEV_OPEN_BROWSER` controls whether `pnpm dev` auto-opens a browser.

## Project Structure

```text
.
├─ public/                     # static assets
├─ src/
│  ├─ api/                     # request modules: auth/devices/gameServer
│  ├─ assets/                  # images and SVG assets
│  ├─ components/              # reusable components and demos
│  ├─ composables/             # `useMenus`, `usePopup`, `useTheme`
│  ├─ layout/                  # Header/Sidebar/Main/NavTab/MenuTree
│  ├─ locales/                 # i18n resources: constant.ts + en/zh-cn
│  ├─ plugins/                 # auto-animate, dayjs, element-plus, i18n, mitt, nprogress, pinia, valibot
│  ├─ router/                  # route definitions and navigation guards
│  ├─ stores/                  # app, keepAlive, locale, navTab, recentActivity, userInfo
│  ├─ styles/                  # global styles and Element Plus theme overrides
│  ├─ types/                   # global.d.ts, app.d.ts, api response typings
│  ├─ utils/                   # helpers like `markIcon`
│  ├─ views/                   # 403/404/500, Dashboard, BanWhitelist, Login, MultiLevelMenu
│  ├─ App.vue
│  └─ main.ts                  # bootstraps router, pinia, i18n, Element Plus, auto-animate
├─ eslint.config.ts
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```

## Routing & Navigation

Routes are defined in `src/router/index.ts` and wrapped by `Layout` to generate the sidebar and nav tabs dynamically. The localized route group `/:locale/*` includes the `dashboard` and `ban-whitelist` business modules, while `components/MenuTree` renders nested navigation for `views/MultiLevelMenu`.

## Internationalization

`src/plugins/i18n.ts` centralizes language preference storage, browser detection, and dynamic loading of `locales/en.json` and `locales/zh-cn.json`. Navigation guards enforce supported locales from `/:locale` and update the Pinia `locale` store. `@valibot/i18n` with `valibot` also ship for localized validation.

## Theme & Dark Mode

`composables/useTheme.ts` handles theme state, toggles, and automatically syncs Element Plus variables (primary/info/warning/success/danger palettes plus surface colors) via CSS vars on `document.documentElement`. Element Plus dark CSS vars are imported through `plugins/elementPlus.ts` (`element-plus/theme-chalk/dark/css-vars.css`), and `Header/AppearanceModeToggler` provides the UI switch.

## Plugins & Tools

- `@formkit/auto-animate`: subtle motion for popups and nav tabs.
- `nprogress`: loading progress bar hooked into navigation guards.
- `mitt`: global event bus (`plugins/mitt.ts`).
- `dayjs`: centralized plugin mixins and locale extensions in `plugins/dayjs.ts`.
- `axios` + `qs`: request helpers used by API modules in `src/api` and the shared HTTP wrapper in `src/utils/http.ts`.
- `sweetalert2`: high-quality modal examples in `components/MessageBoxDemo.vue`.
- `UnoCSS`: typography, color, and animation presets declared via `uno.config.ts`.
- `@imengyu/vue3-context-menu`: context menu support across views (global styles already imported).

## Related Links

- Vue 3: https://vuejs.org/
- Vite: https://vitejs.dev/
- Element Plus: https://element-plus.org/
- 7DTD Admin API (backend): https://github.com/IceCoffee1024/7dtd-serveradmin-api
- Upstream starter reference: https://github.com/element-plus/element-plus-vite-starter

## Common Questions

### How do I change aliases?

`~/` is mapped to `src/` inside `vite.config.ts`'s `resolve.alias`. Update that entry when you modify the alias.

### What about changing the dev server port?

No `server.port` is declared in `vite.config.ts` (Vite defaults to 5173). If you need a fixed port, add:

```ts
export default defineConfig({
  server: {
    port: 5173,
  },
});
```

### How are theme variables managed?

`composables/useTheme.ts` pushes Element Plus vars to `document.documentElement` via CSS variables, so there is no `src/styles/element/*` to edit. Dark CSS vars are loaded in `plugins/elementPlus.ts` from `element-plus/theme-chalk/dark/css-vars.css`.
