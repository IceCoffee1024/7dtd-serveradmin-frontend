---
outline: deep
---

# Initial administrator configuration

> For the administrator signing in for the first time. Requires completed [Installation](./installation), non-empty HTTP 200 Swagger at `<SERVERADMIN_API_BASE_URL>`, and initial credentials from the deployment handoff. This manual never records a real username or password.

## Purpose

Complete one auditable baseline: rotate the initial credentials, prove frontend/backend connectivity, enable only required features, minimize permissions, set schedule time zones, and successfully test a backup.

## Before you begin

- Confirm the backend is running and the API Documentation page can reach `<SERVERADMIN_API_BASE_URL>`.
- Prepare a dedicated test account, a platform time-zone ID such as `UTC` or `Asia/Shanghai`, and a writable backup destination.
- Keep credential, database, and destination values out of screenshots and frontend environment variables.

## Procedure

1. **Sign in and change defaults.** Sign in with the initial deployment credentials and immediately change the username and password in Application Settings or backend configuration. Sign out and sign in again with the new values; do not put credentials in frontend environment variables or screenshots.
2. **Prove backend connectivity.** In browser Network, check that requests target `<SERVERADMIN_API_BASE_URL>`, Swagger/API Documentation opens, and Dashboard returns status. For cross-origin hosting check CORS and the reverse proxy; for same-origin hosting ensure `/api` is not swallowed by the static host.
3. **Check feature availability.** Open Feature Modules and inspect Chat, Colored Chat, Backup, Scheduler, and Player Tracking. Enable only features that have been tested and are needed for operations; a disabled module's page or command is not an available capability.
4. **Set permissions.** In Permission, use a stable SteamID64, `Steam_...`, or `EOS_...` identity for each administrator. 7DTD uses `0` as the maximum privilege and `1000` as the default user level, so assign the least-privileged numeric level that still supports the operator's tasks and create separate command-permission rules. Test with a limited account so allowed commands are visible and unauthorized actions are rejected.
5. **Set time zones explicitly.** In Scheduler and Backup settings, enter a platform time-zone ID such as `UTC` or `Asia/Shanghai` instead of relying on the browser zone. Save and check the next scheduled time and history timestamps.
6. **Run the first backup test.** Configure a writable destination, retention count, and task time zone in Backup, enable the required backup sub-modules, and run a small manual backup. Confirm success, readable files, Backup History, and Audit Logs before adding a Cron schedule.

## Verify the result

- The new administrator credentials work and the old values are no longer used; settings remain after a refresh.
- Dashboard and one protected API request succeed; Feature Modules status agrees with the pages that are actually available.
- Permission testing records both allowed and rejected outcomes; Scheduler and Backup show an explicit time zone rather than an empty value.
- The first backup has a success state, a non-empty file, and an audit entry. An on-call operator confirms that the destination can be reached for recovery.

## Limits and safety notes

::: warning
Frontend `VITE_*` values are exposed to the browser and must not contain passwords, OAuth tokens, or database connection secrets.
:::

::: danger
A successful backup is not a restore proof. Perform at least a readability or recovery exercise in an isolated location before relying on it.
:::

- Lower numeric permission levels grant more 7DTD privilege; keep `0` for full administrators, prefer dedicated operator accounts, and use small command allow-lists.
- A time-zone setting changes the schedules and displays that use it; it does not change the game world's time.

## Related pages

- [Installation](./installation)
- [Frontend and backend publishing](./publishing)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Access control](../integrations-and-access/access-control)
- [Troubleshooting](../reference/troubleshooting)
