# Chrome DevTools MCP UI Checklist

This project currently uses Chrome DevTools MCP for real-page UI inspection instead of Playwright automation. Run these checks when a change affects layout, navigation, settings pages, data tables, dialogs, i18n, dark mode, or any high-risk admin workflow.

## Prerequisites

- Backend is running with the API target needed for the page under test.
- Frontend dev server is running with `pnpm dev`.
- A browser tab is open on the frontend application.
- Login credentials or an existing local session are available.

## Baseline Automated Gate

Run the local automated checks from the frontend repository root before or after the manual pass:

```bash
pnpm verify:local
```

For a targeted development pass:

```bash
pnpm typecheck
pnpm test:unit
pnpm locale:check
pnpm build:analyze
```

## MCP Inspection Pass

Use Chrome DevTools MCP to inspect the active browser tab:

1. Capture a fresh page snapshot after login.
2. Check Console for uncaught errors, Vue warnings, failed dynamic imports, and noisy repeated warnings.
3. Check Network for failed API requests, unexpected redirects, stale generated API paths, and requests stuck pending.
4. Confirm the main layout regions exist: sidebar/menu, header, nav tabs when enabled, main content, and any route-specific primary panel.
5. Navigate the changed page and the nearest parent workflow page.
6. Verify tables keep headers, actions, pagination, empty states, loading states, and long text readable.
7. Verify forms keep labels, validation messages, switches, selects, inputs, steppers, and action buttons visible without overlap.
8. Verify dialogs and drawers fit the viewport, keep footer actions visible, and can be closed.
9. Verify long translated text and long server/player/item names do not clip or overflow their containers.
10. Resize or emulate representative desktop and narrow widths; re-check sidebar, top actions, tables, dialogs, and page title areas.
11. If the change affects dark mode or theme variables, toggle theme and re-check contrast, borders, and disabled states.
12. If the change affects live data, refresh the route and confirm the critical data area recovers without duplicate requests or stale errors.

## Critical Pages To Sample

Prioritize pages touched by the change. For broad UI/layout changes, sample these workflows:

- Dashboard and shared layout shell.
- Server Config.
- Discord Integration settings and runtime panels.
- Economy shop/accounts/transactions.
- Event Automation rules and run history.
- GeoIP Access Control settings.
- Player Tracking and Player Profile.
- Backup task/configuration pages.

## Evidence To Record

For changes with UI risk, record a short note in the related issue, commit message, or validation snapshot:

- Frontend URL and backend target.
- Browser viewport sizes checked.
- Pages/routes checked.
- Console and Network result.
- Any known manual-only gaps, such as real Discord messages or live game-player actions.
