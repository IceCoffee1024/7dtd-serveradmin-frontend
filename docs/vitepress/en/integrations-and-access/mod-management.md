---
outline: deep
---

# Mod management

> For administrators who can inspect the server's discovered mods and toggle a mod state. Installation files still belong to the server's deployment process; this page is a runtime inventory and status check.

## Purpose

Compare the mod inventory with the approved deployment, identify version or load-state drift, and change a mod state only after compatibility review.

## Before you begin

- Confirm the server and game version, the approved mod list, and the rollback package for the maintenance window.
- Ensure the account can read mod metadata and toggle a mod. Do not treat a visible row as proof that the mod is compatible with the current game build.
- Back up the server configuration and world before changing a mod that can alter blocks, entities, saves, or network behavior.

## Procedure

1. Open **Mod Management** and wait for the table to load. Search by display name, internal name, author, description, or folder name.
2. Review **Mod**, **Author**, **Version**, **Website**, **Loaded**, and **Installed**. The folder name is the stable key used for a status request.
3. Compare each row with the approved manifest and check the mod author's compatibility notes. Treat an external website as untrusted input and open it only through a controlled operator browser.
4. If the change is approved, use the row action to toggle the mod state. Wait for the success result and reload the table; do not click the action again while the previous request is pending.
5. Restart the game server when the mod or its loader requires it. Keep the previous package and backup until the server has loaded a test world or the planned smoke test has passed.

## Verify the result

- The row shows the expected **Loaded** and **Installed** state after refresh, with the same folder name as the approved manifest.
- The game log has no mod-load or dependency error, and a dedicated test account can connect and exercise the affected feature.
- The module center and dashboard show the dependent feature as available. If not, revert the toggle and restore the known-good package.

## Limits and safety notes

::: warning
The table reflects what the backend and game process report at the time of the request. It does not resolve dependency order, license compatibility, or binary integrity for a third-party mod.
:::

::: danger
Toggling or replacing a mod can change world data or make a server unable to start. Schedule the action, keep a backup, and obtain a rollback owner before confirming it.
:::

## Related pages

- [Feature modules](../game-and-player-management/feature-modules)
- [Server configuration](./server-configuration)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Console and logs](../daily-operations/console-and-logs)
