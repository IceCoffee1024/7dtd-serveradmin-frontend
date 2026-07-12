---
outline: deep
---

# Product Overview and Lifecycle

> For server owners, administrators, and on-call operators. Normal deployment uses one GitHub Release ZIP extracted as `Mods/ServerAdmin`; the package includes the server mod and web console. This manual describes current `main` behavior only; historical versions and disabled feature modules are out of scope.

## Purpose

Establish one operating model from Release ZIP installation and initial administrator configuration through daily duty, while making the package, backend, and game-server boundaries explicit.

## Before you begin

- Use the Release ZIP as one deployment unit: extract it as `Mods/ServerAdmin` so the server mod and web console stay paired.
- Have access to the dedicated server, the configured packaged-console URL, and an administrator account without putting secret values in notes or screenshots.
- Only maintainers and deployment engineers changing backend APIs or building a custom frontend use the advanced source workflow.

## Product boundary

The normal owner package has two parts that must stay compatible:

- **The server mod** is installed under `Mods/ServerAdmin`. It interacts with the game process, reads player/world state, and writes configuration, audit, and history data to the backend database.
- **The web console** is included in the same Release ZIP. It reads data and submits management actions through the server mod's HTTP API.

The web console cannot replace the game server or server mod. A page can load while the server mod is unreachable, but its data and actions are not reliable. A feature can also be unavailable because of backend settings, server-version support, or administrator permissions.

## Version applicability

This manual follows the current `main` menu and released package behavior. Keep the server mod and web console from the same Release ZIP together; do not replace individual package files from unrelated versions. Before a Release replacement, preserve configuration and data by following [Upgrade](./upgrade). Build and publish from source is an advanced maintainer workflow for backend API changes or a custom frontend, not part of normal owner deployment.

## Procedure

1. Follow [Installation](./installation) to download a Release ZIP, extract it as `Mods/ServerAdmin`, and verify the first run.
2. Follow [Initial administrator configuration](./initial-administrator-configuration) for packaged-console login, credential rotation, connectivity, permissions, time zone, and the first backup test. The administrator baseline is saved and auditable.
3. Start daily duty on the [Dashboard](../daily-operations/dashboard), then investigate through players, GPS, chat, and log pages. Each investigation ends at an observable record or a documented unavailable state.
4. Before replacing a Release ZIP, follow [Upgrade](./upgrade) to preserve configuration and data and prepare rollback.

## Verify the result

- The browser accepts a login and the dashboard shows online/offline state plus a recent sample time.
- Player, chat, audit, and game-event pages load data, or show an empty state when no records exist.
- A permitted, read-only operation can be run and its result appears in the console or related log.
- The first backup task succeeds and is visible in backup history and audit records.

## Limits and safety notes

::: warning
Never put tokens, passwords, real player IDs, real IP addresses, or server filesystem paths in documentation or screenshots.
:::

::: danger
Console commands, kicks, bans, teleports, item grants, and profile resets can affect players or the world. Confirm the target, permission, maintenance window, and rollback path first.
:::

- A page shows a backend sample or persisted record, not every game-process frame. Cross-check important decisions with console, audit, and game-event records.

## Related pages

- [Installation](./installation)
- [Upgrade](./upgrade)
- [Initial administrator configuration](./initial-administrator-configuration)
- [Dashboard](../daily-operations/dashboard)
- [Troubleshooting](../reference/troubleshooting)
