# Frontend Build Analysis

This project uses Vite/Rolldown for production builds. The current build strategy focuses on predictable lazy routes, manual real-page UI inspection, and explicit vendor chunk boundaries.

## Commands

Run a production build:

```bash
pnpm build
```

Run a build and print the largest generated JS/CSS assets:

```bash
pnpm build:analyze
```

You can increase or reduce the number of printed rows:

```bash
BUILD_ANALYZE_ROWS=30 pnpm build:analyze
```

## Current Chunk Strategy

`vite.config.ts` defines explicit Rolldown code-splitting groups for:

- Vue, Vue Router, Pinia, and Pinia Colada.
- Element Plus.
- OpenLayers.
- Vue I18n and Intlify runtime.
- Chart.js and Vue Chart.js.
- Remaining large node module dependencies.

The application routes are already lazy-loaded in `src/router/index.ts`, so page-level features should normally stay outside the initial route chunk unless they are imported by global layout, global plugins, shared components, or generated API/runtime helpers.

## Known Large Areas

- `index` can still be large because the global layout, route table, shared stores, generated API client setup, icons, and common UI helpers are loaded at startup.
- Element Plus remains a significant vendor area because table, form, overlay, and feedback components are widely used across management pages.
- Locale JSON files are lazy-loaded for non-default languages. English, Simplified Chinese, and Traditional Chinese are loaded statically as default/common paths.

## Optimization Rules

- Do not hide real size regressions by raising `build.chunkSizeWarningLimit` unless the warning is intentionally accepted.
- Prefer reducing eager imports in global layout/plugins before splitting arbitrary chunks.
- Avoid over-splitting Element Plus by internal component folders unless the measured result improves the initial route payload. It can make the config harder to maintain without reducing `index`.
- Keep shared form components synchronous unless a measured build report shows a clear benefit and the affected pages pass the Chrome DevTools MCP UI checklist.
- After changing chunk strategy, run:

```bash
pnpm typecheck
pnpm test:unit
pnpm locale:check
pnpm build:analyze
```

If the change affects route layout, dialogs, tables, translated text, or responsive behavior, also run the checklist in `docs/chrome-devtools-mcp-ui-checklist.md` against the local browser page.
