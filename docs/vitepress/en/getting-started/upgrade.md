---
outline: deep
---

# Upgrade with a Release ZIP

> For an administrator with a maintenance window and backup access. Requires a current Release ZIP, a compatible target Release ZIP, and a recoverable backup of ServerAdmin configuration and data.

## Purpose

Replace released program files while retaining the operator-managed configuration and database needed by the live server.

## Before you begin

- Record the running version and retain the archive or extracted directory as a rollback candidate.
- Back up `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/appsettings.json`, the ServerAdmin database under `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/`, relevant game-server configuration, and world data.
- Read the target Release compatibility, prerequisites, known issues, and manual configuration changes.

## Procedure

1. Notify players, stop the dedicated server, and confirm that the backup is locatable before replacing files.
2. Extract the new archive into `<7DTD_SERVER_ROOT>/Mods/`. Replace released assemblies, dependencies, `wwwroot/`, and `Config/appsettings.Default.json`.
3. Preserve `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/appsettings.json` and the ServerAdmin database under `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/`. The default file supplies shipped values; the writable override supplies administrator changes.
4. Start the server, inspect the mod-load result, sign in, and perform a read-only Dashboard or Player List check.
5. If startup, authentication, or migration fails, stop the server and restore matching prior program files together with the pre-upgrade `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/appsettings.json` and ServerAdmin database backup.

## Verify the result

- The target version loads without a new dependency or migration failure.
- Existing administrator configuration and expected management data remain after login.

## Limits and safety notes

::: danger
After a database migration, old binaries alone are not a safe rollback. Restore the matching pre-upgrade database and configuration too.
:::

## Related pages

- [Installation](./installation)
- [Initial administrator configuration](./initial-administrator-configuration)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
- [Advanced source publishing](./publishing)
