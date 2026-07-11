# Product Overview and Lifecycle

## Applicability and prerequisites

This page is for server owners, administrators, and on-call operators. You need a deployed 7 Days to Die server, a reachable ServerAdmin backend, and an administrator account. The manual describes the current `main` behavior; it does not promise historical versions or disabled feature modules.

## Purpose

Establish one operating model from installation and configuration through publishing and daily duty, while making the frontend, backend, and game-server boundaries explicit.

## Product boundary

ServerAdmin has two parts that must stay compatible:

- **The backend** is the server mod and HTTP API. It interacts with the game process, reads player/world state, and writes configuration, audit, and history data to the backend database.
- **The frontend** is the Vue administration console. It reads data and submits management actions through the API, using a generated OpenAPI client for request shapes.

The frontend cannot replace the game server or backend. A page can load while the backend is unreachable, but its data and actions are not reliable. A feature can also be unavailable because of backend settings, server-version support, or administrator permissions.

## Recommended lifecycle

1. Read [Installation](./installation) and prepare the server root, backend publish output, and frontend build environment.
2. Follow [Initial administrator configuration](./initial-administrator-configuration) for first login, password rotation, connectivity, permissions, time zone, and the first backup test.
3. Use [Publishing](./publishing) for releases; [Upgrade preparation](./upgrade) covers backup and rollback.
4. Start daily duty on the [Dashboard](../daily-operations/dashboard), then investigate through players, GPS, chat, and log pages.

## Version applicability

This manual follows the current `main` menu and API. Frontend and backend versions must use a client generated from the same Swagger document. If backend endpoints change, restart the backend and wait for a non-empty HTTP 200 Swagger response before generating the client again. There is no version switch in this edition, and development addresses are not production addresses.

## Observable completion signals

- The browser accepts a login and the dashboard shows online/offline state plus a recent sample time.
- Player, chat, audit, and game-event pages load data, or show an empty state when no records exist.
- A permitted, read-only operation can be run and its result appears in the console or related log.
- The first backup task succeeds and is visible in backup history and audit records.

## Limits and safety

- Never put tokens, passwords, real player IDs, real IP addresses, or server filesystem paths in documentation, screenshots, or `VITE_*` variables.
- Console commands, kicks, bans, teleports, item grants, and profile resets can affect players or the world; confirm the target and permission first.
- A page shows a backend sample or persisted record, not every game-process frame. Cross-check important decisions with console, audit, and game-event records.

## Related pages

- [Installation](./installation)
- [Upgrade](./upgrade)
- [Initial administrator configuration](./initial-administrator-configuration)
- [Frontend and backend publishing](./publishing)
- [Dashboard](../daily-operations/dashboard)
- [Troubleshooting](../reference/troubleshooting)
