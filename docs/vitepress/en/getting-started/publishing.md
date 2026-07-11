---
outline: deep
---

# Frontend and backend publishing

> For an operator publishing a backend mod or API change that requires a regenerated frontend client. Requires backend publish access, a restartable 7DTD service, the frontend workspace, and `<SERVERADMIN_API_BASE_URL>`.

## Purpose

Make the Swagger document served by the running backend the single API contract, then generate and check the frontend client so the published UI does not send an old request shape.

## Before you begin

- Open a maintenance window, notify players, and verify the publish profile targets the intended server.
- Keep the previous backend output and matching frontend build as rollback candidates.
- Confirm that `<SERVERADMIN_API_BASE_URL>` is sanitized and that the browser will not receive credentials or tokens from `VITE_*` variables.

## Procedure

1. **Publish the backend.** From the backend workspace run the reviewed publish command, for example `dotnet publish src\LSTY.Sdtd.ServerAdmin\LSTY.Sdtd.ServerAdmin.csproj /p:PublishProfile=FolderProfile1`, and deploy the output under `<7DTD_SERVER_ROOT>`. Keep the previous output as a rollback candidate.
2. **Restart the server.** Restart 7DTD through the authorized maintenance procedure; players will be disconnected. Do not publish the frontend before process recovery.
3. **Wait for Swagger recovery.** Poll `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`. It must be HTTP 200 and contain non-empty JSON. An HTTP 200 empty response, an HTML login page, or stale cache is not a pass.
4. **Generate the client.** Run `pnpm api:gen` in the frontend workspace and confirm that types, SDK, validation, and Pinia Colada files under `src/generated/api/` update.
5. **Check the frontend.** Run `pnpm typecheck` followed by `pnpm locale:check`. Only then run `pnpm build` and publish the static output.
6. **Smoke test.** Clear proxy/CDN caches that can serve old static files, sign in again, and check Dashboard, Player List, chat, Console, Audit Logs, and Swagger/API Documentation.

## Verify the result

- Record each signal: backend publish success, server online again, non-empty Swagger 200, completed `api:gen`, and passing type and locale checks.
- Browser Network has no old paths, repeated 5xx responses, or requests stuck pending; page success/empty states agree with backend data.
- Protected actions still follow Permission and console command policy, and test actions appear in Audit Logs.

## Limits and safety notes

::: warning
Do not skip the Swagger wait, and do not use real tokens, passwords, private UNC paths, or local machine names in documentation or script examples.
:::

::: danger
Restarting 7DTD disconnects players. Publishing static files does not roll back a backend; stop traffic and restore the matching pair when versions disagree.
:::

- `pnpm api:gen` can succeed against an old backend and leave stale types. Confirm non-empty Swagger first.

## Related pages

- [Upgrade](./upgrade)
- [Installation](./installation)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
