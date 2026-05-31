# 7DTD Server Admin Frontend

A Vue 3 + Vite + Element Plus admin console for 7 Days to Die server operations. It provides a localized dashboard, player tools, chat management, economy modules, teleport tools, scheduled tasks, backups, audit logs, and application settings.

![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)
![Vite](https://img.shields.io/badge/Vite-8.x-747bff.svg)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## Features

- Vue 3.5, Vite 8, TypeScript, pnpm 11, Element Plus 2, Pinia, Vue Router 5, Vue I18n 11.
- Full console shell with header, sidebar, nav tabs, sticky footer behavior, dark mode, theme settings, and localized hash routes such as `/#/zh-cn/dashboard`.
- Refined visual system for cards, tables, dialogs, search panels, tabs, forms, empty states, and dark-mode Element Plus variables.
- Dashboard monitoring for server status, system metrics, charts, quick actions, recent activity, and system information.
- Player and map tools: online/history players, player detail/inventory/skills dialogs, GPS map, game items, server config, and console.
- Game feature modules: live chat, chat history, chat settings, colored chat, game notices, teleport, economy, achievements, online rewards, vote restart, and vote kick.
- Operations and system modules: restart, scheduler, backup, audit logs, game event logs, permissions, ban/whitelist, mod management, app settings, and Swagger/API documentation.
- Hey API generated SDK, types, Valibot schemas, and Pinia Colada query/mutation helpers.
- OpenLayers map support, Chart.js charts, context menus, nprogress, mitt event bus, dayjs utilities, auto-animate, UnoCSS, and Sass.

## Quick Start

```bash
pnpm install
pnpm dev
```

Build and checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

API generation:

```bash
pnpm api:gen
pnpm api:check
```

## Environment Variables

The app reads Vite environment variables from `.env`, `.env.development`, and `.env.production`.

Runtime variables in `.env`:

```dotenv
VITE_OPENAPI_BASE_URL=

VITE_APP_PUBLIC_BASE_PATH=/
VITE_APP_VERSION=v1.0

VITE_DEFAULT_USERNAME=admin
VITE_DEFAULT_PASSWORD=password
```

Development variables in `.env.development`:

```dotenv
BROWSER=chrome

OPENAPI_INPUT=http://7dtdserver.local:8088/swagger/v1/swagger.json
VITE_DEV_API_PROXY_TARGET=http://7dtdserver.local:8088
```

Notes:

- `VITE_OPENAPI_BASE_URL` is the runtime backend origin. Keep it empty for same-origin deployments, or set it for cross-origin deployments.
- `VITE_APP_PUBLIC_BASE_PATH` is passed to Vite `base`; use it when deploying under a sub-path.
- `VITE_APP_VERSION` is shown on the login page with the project name.
- `VITE_DEFAULT_USERNAME` and `VITE_DEFAULT_PASSWORD` document the default/demo login credentials (`admin` / `password`). The current login page does not auto-fill or read these values directly.
- Do not put real production secrets in any `VITE_*` variable. Vite exposes them to browser-side code.
- `BROWSER=chrome` asks Vite to open Chrome during local development.
- `OPENAPI_INPUT` is used by `pnpm api:gen` to generate code from the Swagger/OpenAPI document.
- `VITE_DEV_API_PROXY_TARGET` is used by `vite.config.ts` to proxy `/api` and `/swagger` during development.

## Project Structure

```text
.
├─ public/                     # static assets
├─ src/
│  ├─ api/                     # generated API client configuration
│  ├─ assets/                  # images and custom SVG icons
│  ├─ components/              # shared components: MyTable, MyForm, dialogs, charts, buttons
│  ├─ composables/             # menus, popup, table, theme, command history, form helpers
│  ├─ generated/api/           # Hey API generated SDK, types, schemas, Pinia Colada options
│  ├─ layout/                  # Header, Sidebar, Main, NavTab, Footer, MenuTree
│  ├─ locales/                 # en and zh-cn i18n resources
│  ├─ plugins/                 # Element Plus, i18n, pinia, mitt, dayjs, nprogress, valibot
│  ├─ queries/                 # query invalidation, pagination, and business query helpers
│  ├─ router/                  # route definitions and navigation guards
│  ├─ stores/                  # app, locale, userInfo, navTab, keepAlive, gameEvent, recentActivity
│  ├─ styles/                  # global styles, CSS variables, Element Plus overrides
│  ├─ types/                   # global type declarations
│  ├─ utils/                   # formatting, icons, assets, table helpers
│  ├─ views/                   # business pages and error pages
│  ├─ App.vue
│  └─ main.ts
├─ eslint.config.ts
├─ openapi-ts.config.ts
├─ uno.config.ts
├─ vite.config.ts
└─ tsconfig.json
```

## Main Routes

Routes are defined in `src/router/index.ts`. Authenticated pages live under `/:locale/` and are rendered by the shared `Layout`.

- Monitoring: Dashboard, Player List, GPS Map.
- Game features: Live Chat, Chat History, Chat Settings, Colored Chat, Economy, Game Items, Game Notice, Teleport, Vote Restart, Vote Kick, Achievement, Online Reward.
- Server management: Server Config, Ban/Whitelist, Permission, Mod Management.
- Operations: Console, Restart, Scheduler, Backup.
- System: Audit Logs, Game Event Logs, App Settings, API Documentation.

## Layout And Styling

The UI uses a shared console layout with fixed-height content areas where appropriate. Table-heavy feature pages keep tabs, search panels, and toolbars visible while the table body scrolls internally. The footer follows normal document flow: it stays near the bottom when content is short and follows the main content when pages grow.

Global visual styling is centralized in `src/styles/index.scss` and shared components:

- `MyTable` handles server-side pagination, search forms, column selection, context menus, batch actions, internal table scrolling, and CSV export.
- `MyForm` renders configuration-driven forms with validation, responsive grid layout, visible focus states, and Element Plus field styling.
- `MyCard`, `MyDialog`, `IconButton`, `LineChart`, and player dialogs provide reusable visual patterns.

## Internationalization

`src/plugins/i18n.ts` handles language preference storage, browser language detection, and loading `src/locales/en.json` and `src/locales/zh-cn.json`. Navigation guards validate supported locales and apply the matching Pinia `locale` store state.

## Theme And Dark Mode

`composables/useTheme.ts` stores theme settings and synchronizes Element Plus CSS variables to `document.documentElement`. Element Plus dark variables are imported in `src/plugins/elementPlus.ts`, and the header exposes appearance controls for theme mode, colors, grayscale, color weakness, layout options, and visibility toggles.

## API Layer

`@hey-api/openapi-ts` generates files under `src/generated/api/` from `OPENAPI_INPUT`. The generated client is configured in `src/api/generatedClient.ts`, uses `VITE_OPENAPI_BASE_URL`, and integrates with auth token handling. Pinia Colada helpers from the generated API are used for queries and mutations across feature modules.

## Related Links

- Vue 3: https://vuejs.org/
- Vite: https://vitejs.dev/
- Element Plus: https://element-plus.org/
- 7DTD Admin API backend: https://github.com/IceCoffee1024/7dtd-serveradmin-api
- Upstream starter reference: https://github.com/element-plus/element-plus-vite-starter

## License

[MIT License](LICENSE)
