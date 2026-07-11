# Frontend and backend publishing

## Applicability and prerequisites

Use this maintenance-window sequence when the backend mod or API changes and the frontend client must be regenerated. Prepare backend publish access, a restartable 7DTD service, the frontend workspace, and `<SERVERADMIN_API_BASE_URL>`.

## Purpose

Make the Swagger document served by the running backend the single API contract, then generate and check the frontend client so the published UI does not send an old request shape.

## Required order

1. **Publish the backend.** From the backend workspace run the reviewed publish command, for example `dotnet publish src\LSTY.Sdtd.ServerAdmin\LSTY.Sdtd.ServerAdmin.csproj /p:PublishProfile=FolderProfile1`, and deploy the output under `<7DTD_SERVER_ROOT>`. Keep the previous output as a rollback candidate.
2. **Restart the server.** Restart 7DTD through the authorized maintenance procedure; players will be disconnected. Do not publish the frontend before process recovery.
3. **Wait for Swagger recovery.** Poll `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`. It must be HTTP 200 and contain non-empty JSON. An HTTP 200 empty response, an HTML login page, or stale cache is not a pass.
4. **Generate the client.** Run `pnpm api:gen` in the frontend workspace and confirm that types, SDK, validation, and Pinia Colada files under `src/generated/api/` update.
5. **Check the frontend.** Run `pnpm typecheck` followed by `pnpm locale:check`. Only then run `pnpm build` and publish the static output.
6. **Smoke test.** Clear proxy/CDN caches that can serve old static files, sign in again, and check Dashboard, Player List, chat, Console, Audit Logs, and Swagger/API Documentation.

## Observable verification

- Record each signal: backend publish success, server online again, non-empty Swagger 200, completed `api:gen`, and passing type and locale checks.
- Browser Network has no old paths, repeated 5xx responses, or requests stuck pending; page success/empty states agree with backend data.
- Protected actions still follow Permission and console command policy, and test actions appear in Audit Logs.

## Limits and safety

- Do not skip the Swagger wait, and do not use real tokens, passwords, private UNC paths, or local machine names in documentation or script examples.
- `pnpm api:gen` can succeed against an old backend and leave stale types. Confirm non-empty Swagger first.
- Publishing static files does not roll back a backend. Stop traffic and restore the matching pair when versions disagree.

## Related pages

- [Upgrade](./upgrade)
- [Installation](./installation)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
