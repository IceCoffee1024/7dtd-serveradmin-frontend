# Visual Regression Maintenance

The visual suite is a local safety net for high-risk management workflows. Keep it focused on pages where layout, routing, i18n, or feature orchestration failures would block real administration work.

## Current Critical Suite

`pnpm visual:critical` covers:

- Discord Integration settings and runtime controls
- Economy Shop table behavior
- EventAutomation rules and critical interactions
- GeoIP Access Control settings
- ServerConfig visual and live-read scenarios

## When To Add A Visual Test

Add or expand a visual test when a change affects:

- A top-level admin workflow or feature settings page.
- Responsive layout behavior on mobile/tablet/desktop.
- Dark mode, locale expansion, or long translated text.
- Shared layout components such as tables, sidebars, headers, dialogs, and form panels.
- A previous visual/layout regression.

Prefer unit tests or pure model tests for isolated formatting, validation, computed state, and API payload conversion.

## Test Design Rules

- Use shared helpers from `tests/visual/helpers.ts` for login, console diagnostics, layout checks, and scenario navigation.
- Assert stable page-level selectors owned by this app instead of Element Plus internal DOM details.
- Check for user-visible overflow, clipping, and broken responsive layout, not pixel-perfect implementation details.
- Include mobile coverage only when the page is expected to work on mobile or the change touches shared responsive behavior.
- Keep screenshots and assertions scoped to the changed workflow so local runs stay fast.

## Local Run Strategy

During development, run the smallest matching spec first:

```bash
pnpm visual:discord
```

Before wrapping a feature branch or local release, run:

```bash
pnpm visual:critical
```

Playwright auto-starts Vite when `PLAYWRIGHT_BASE_URL` is not provided. Use `PLAYWRIGHT_BASE_URL` only when testing against an already running frontend instance.
