---
outline: deep
---

# Upgrade and rollback preparation

> For an administrator with a maintenance window and permission to back up files and databases. Upgrade the frontend and backend that represent current `main`; never pair an old generated client with a new backend.

## Purpose

Upgrade inside a reversible maintenance window, prove that Swagger and the generated client agree, and then return to daily operations.

## Before you begin

1. Record the current frontend build, backend publish, server version, and configuration changes.
2. Notify players and schedule a maintenance window; pause jobs that modify world or player data.
3. Back up the backend database, ServerAdmin configuration, and server configuration/world saves under `<7DTD_SERVER_ROOT>`. Record the time, source, and recoverable location.
4. Record whether `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json` currently returns non-empty HTTP 200, and record the frontend variable names (never secret values).

## Procedure

1. Publish the new backend, keeping the previous output and configuration as a rollback candidate.
2. Restart the 7DTD server and wait for process recovery; do not generate the client while Swagger is unavailable.
3. Poll Swagger until it returns HTTP 200 with a non-empty JSON body.
4. Run `pnpm api:gen` in the frontend, followed by `pnpm typecheck` and `pnpm locale:check`.
5. Build and publish the frontend static files, clear proxy or CDN caches that can serve old JS, and sign in again.

## Verify the result

- The Swagger document contains the paths expected by the new backend, and generated files under `src/generated/api/` have the expected update time.
- Type and locale checks pass; open Dashboard, Player List, chat, Console, Audit Logs, and Game Event Logs at least once.
- Run a read-only operation. Upgraded API requests return expected status codes, with no new failure records in Audit Logs.

## Limits and safety notes

::: danger
If Swagger stays empty, the API returns 5xx, or a data migration fails, stop frontend publication, restore the previous backend and matching frontend build, and verify critical data from backups.
:::

- Do not roll back only the frontend to hide a backend mismatch; the generated client must come from the backend that is actually running.
- Upgrades and rollbacks can disconnect players. Restarts, migrations, backup restores, and world operations belong in a maintenance window and should remain audited.

## Related pages

- [Installation](./installation)
- [Frontend and backend publishing](./publishing)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
