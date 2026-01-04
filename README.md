# Element Plus Template

A Vue 3 + Vite + Element Plus scaffold tailored for mid/large admin consoles, wired with Pinia, router layout, theme controls, i18n, and essential plugins so you can launch a scalable dashboard quickly.

![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)
![Vite](https://img.shields.io/badge/Vite-7.x-747bff.svg)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## Key Features

- Vue 3 + Vite 7 + TypeScript with pnpm as the package manager.
- Element Plus: component auto-import via `unplugin-vue-components` while `useTheme` synchronizes Element Plus CSS vars and dark-mode palette instead of a static `src/styles/element/index.scss`.
- Unified layout: `layout/Header`, `layout/Sidebar`, `layout/Main`, `layout/NavTab`, and `layout/MenuTree` compose the console navigation framework.
- Routing: hash mode routes are wrapped by `Layout`, support localized entry points like `/:locale/home`, and ship with 403/404/500 samples plus multi-level menu demos.
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

## Project Structure

```text
.
├─ public/                     # static assets
├─ src/
│  ├─ assets/                  # images, SVGs
│  ├─ components/              # example components and fragments
│  ├─ composables/              # `useMenus`, `usePopup`, `useTheme`
│  ├─ layout/                   # Header/Sidebar/Main/NavTab/MenuTree
│  ├─ locales/                  # constant.ts + en/zh-cn JSONs
│  ├─ plugins/                  # auto-animate, dayjs, element-plus, i18n, mitt, nprogress, pinia, valibot
│  ├─ router/                   # route definitions, navigation guards, nprogress
│  ├─ stores/                   # app, keep-alive, locale, nav-tab
│  ├─ styles/                   # global styles, UnoCSS additions, Element Plus theme overrides
│  ├─ types/
│  ├─ utils/                    # helpers like `markIcon`
│  ├─ views/                    # 403/404/500, Home, MultiLevelMenu
│  ├─ App.vue
│  └─ main.ts                   # bootstraps router, pinia, i18n, Element Plus, auto-animate
├─ eslint.config.js
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```

## Routing & Navigation

Routes are defined in `src/router/index.ts` and wrapped by `Layout` to generate the sidebar and nav tabs dynamically. The `/:locale/home` entry reacts to the `locale` parameter and renders language-specific menus while `components/MenuTree` displays nested navigation from `views/MultiLevelMenu`.

## Internationalization

`src/plugins/i18n.ts` centralizes language preference storage, browser detection, and dynamic loading of `locales/en.json` and `locales/zh-cn.json`. Navigation guards enforce supported locales from `/:locale` and update the Pinia `locale` store. `@valibot/i18n` with `valibot` also ship for localized validation.

## Theme & Dark Mode

`composables/useTheme.ts` handles theme state, toggles, and automatically syncs Element Plus variables (primary/info/warning/success/danger palettes plus surface colors) via CSS vars on `document.documentElement`. Element Plus dark CSS vars are imported through `plugins/element-plus.ts` (`element-plus/theme-chalk/dark/css-vars.css`), and `Header/AppearanceModeToggler` provides the UI switch.

## Plugins & Tools

- `@formkit/auto-animate`: subtle motion for popups and nav tabs.
- `nprogress`: loading progress bar hooked into navigation guards.
- `mitt`: global event bus (`plugins/mitt.ts`).
- `dayjs`: centralized plugin mixins and locale extensions in `plugins/dayjs.ts`.
- `axios` + `qs`: request helpers to pair with utils or Ant Design components.
- `sweetalert2`: high-quality modal examples in `components/MessageBoxDemo.vue`.
- `UnoCSS`: typography, color, and animation presets declared via `uno.config.ts`.
- `@imengyu/vue3-context-menu`: context menu support across views (global styles already imported).

## Related Links

- Vue 3: https://vuejs.org/
- Vite: https://vitejs.dev/
- Element Plus: https://element-plus.org/
- Upstream Template: https://github.com/element-plus/element-plus-vite-starter

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

`composables/useTheme.ts` pushes Element Plus vars to `document.documentElement` via CSS variables, so there is no `src/styles/element/*` to edit. Dark CSS vars are loaded in `plugins/element-plus.ts` from `element-plus/theme-chalk/dark/css-vars.css`.
