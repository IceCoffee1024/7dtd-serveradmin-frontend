# Installation

## Applicability, role, and prerequisites

This page is for the deploying administrator. Prepare a maintainable 7DTD server, `<7DTD_SERVER_ROOT>`, the backend source or publish output, Node.js and pnpm, and a browser-reachable `<SERVERADMIN_API_BASE_URL>`. You must be able to restart the game server during a maintenance window and read Swagger.

## Purpose

After installation, the backend should expose an API beside the game process, the frontend should load and target that API, and an administrator should be able to sign in and see dashboard data.

## Procedure

1. **Prepare backend configuration.** Deploy the backend output to the ServerAdmin mod location under `<7DTD_SERVER_ROOT>` and set the web URL, administrator account, database path, and logging options for the environment. Do not commit a production password.
2. **Start and verify the backend.** Start the 7DTD server and confirm that the backend listens at `<SERVERADMIN_API_BASE_URL>`. Request `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`; continue only after HTTP 200 with a non-empty JSON document.
3. **Install frontend dependencies.** Run `pnpm install` in the frontend repository. For a cross-origin deployment set `VITE_OPENAPI_BASE_URL=<SERVERADMIN_API_BASE_URL>`; leave it empty for same-origin hosting and set `VITE_APP_PUBLIC_BASE_PATH` for a sub-path deployment.
4. **Build the frontend.** Run `pnpm build` and publish the static output to a supported static host or reverse proxy. Route `/api`, `/swagger`, and frontend page paths according to the hosting model.
5. **Open the first session.** Open the frontend, choose the intended language, and sign in with the administrator account supplied by the deployment. If the page opens but requests fail, check the API base URL, reverse proxy, and browser Network panel first.

## Observable verification

- The Swagger URL returns non-empty JSON, and browser Network requests target the expected `<SERVERADMIN_API_BASE_URL>`.
- After login, the dashboard shows online/offline state and samples such as FPS or memory; an unreachable backend produces an error or empty state rather than a fabricated success.
- Player List and Console can load the commands allowed for the account; a disabled module is clearly unavailable in Feature Modules.

## Limits and safety

- `VITE_*` values are exposed to the browser and must not contain tokens, passwords, or other secrets.
- Publishing static files does not start the backend and does not replace 7DTD save/configuration backups.
- Reverse proxy, HTTPS, CORS, and authentication policies belong to the deployment environment. Re-run Swagger, login, and API request checks after changing them.

## Related pages

- [Upgrade](./upgrade)
- [Initial administrator configuration](./initial-administrator-configuration)
- [Frontend and backend publishing](./publishing)
- [Dashboard](../daily-operations/dashboard)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
