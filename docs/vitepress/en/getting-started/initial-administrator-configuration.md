# Initial administrator configuration

## Applicability, role, and prerequisites

This page is for the administrator signing in for the first time. Complete [Installation](./installation), confirm that Swagger at `<SERVERADMIN_API_BASE_URL>` returns non-empty HTTP 200, and obtain the initial administrator credentials from the deployment handoff. This manual never records a real username or password.

## Purpose

Complete one auditable baseline: rotate the initial credentials, prove frontend/backend connectivity, enable only required features, minimize permissions, set schedule time zones, and successfully test a backup.

## Procedure

1. **Sign in and change defaults.** Sign in with the initial deployment credentials and immediately change the username and password in Application Settings or backend configuration. Sign out and sign in again with the new values; do not put credentials in frontend environment variables or screenshots.
2. **Prove backend connectivity.** In browser Network, check that requests target `<SERVERADMIN_API_BASE_URL>`, Swagger/API Documentation opens, and Dashboard returns status. For cross-origin hosting check CORS and the reverse proxy; for same-origin hosting ensure `/api` is not swallowed by the static host.
3. **Check feature availability.** Open Feature Modules and inspect Chat, Colored Chat, Backup, Scheduler, and Player Tracking. Enable only features that have been tested and are needed for operations; a disabled module's page or command is not an available capability.
4. **Set permissions.** In Permission, use a stable SteamID64, `Steam_...`, or `EOS_...` identity for each administrator, choose the lowest required server permission level, and create separate minimum rules for console commands. Test with a limited account so allowed commands are visible and unauthorized actions are rejected.
5. **Set time zones explicitly.** In Scheduler and Backup settings, enter a platform time-zone ID such as `UTC` or `Asia/Shanghai` instead of relying on the browser zone. Save and check the next scheduled time and history timestamps.
6. **Run the first backup test.** Configure a writable destination, retention count, and task time zone in Backup, enable the required backup sub-modules, and run a small manual backup. Confirm success, readable files, Backup History, and Audit Logs before adding a Cron schedule.

## Observable verification

- The new administrator credentials work and the old values are no longer used; settings remain after a refresh.
- Dashboard and one protected API request succeed; Feature Modules status agrees with the pages that are actually available.
- Permission testing records both allowed and rejected outcomes; Scheduler and Backup show an explicit time zone rather than an empty value.
- The first backup has a success state, a non-empty file, and an audit entry. An on-call operator confirms that the destination can be reached for recovery.

## Limits and safety

- Frontend `VITE_*` values are exposed to the browser and must not contain passwords, OAuth tokens, or database connection secrets.
- Higher permission levels increase console and automation side effects; prefer dedicated operator accounts and small command allow-lists.
- A time-zone setting changes the schedules and displays that use it; it does not change the game world's time.
- A successful backup is not a restore proof. Perform at least a readability or recovery exercise in an isolated location.

## Related pages

- [Installation](./installation)
- [Frontend and backend publishing](./publishing)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Access control](../integrations-and-access/access-control)
- [Troubleshooting](../reference/troubleshooting)
