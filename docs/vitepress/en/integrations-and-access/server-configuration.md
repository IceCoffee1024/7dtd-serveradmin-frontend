---
outline: deep
---

# Server configuration

> For an administrator with permission to read and update game-server settings. The backend must be connected to the intended 7DTD process, and a restart may be required before a changed game setting takes effect.

## Purpose

Review the server configuration exposed by the running game server and change one setting at a time with a recorded verification step.

## Before you begin

- Confirm that the account can read and update server configuration and that the selected server is the intended target.
- Make a configuration backup before changing network, authentication, file-location, or administrative-interface settings.
- Agree on a maintenance window. Port, password, Telnet, dashboard, and file-location changes can disconnect players or make the server unreachable.
- Use placeholders such as `<SERVER_CONFIG_FILE>` and `<7DTD_SERVER_ROOT>` in tickets and examples. Never copy a real password or private path into a manual or screenshot.

## Procedure

### Review the current values

1. Open **Server Config** and wait for the grouped list to load. Groups such as Servers, Network, Slots, Administrative Interface, and Folder and File Locations are built from the values returned by the backend.
2. Read the description beside the key before editing. The value shown in the table is the current server value, not an unsaved browser draft.
3. For a planned change, record the key, previous value, reason, operator, and maintenance window in the change record.

### Edit and save

1. Select the edit action for one key, enter the new value, and confirm. Keep the value in the format accepted by 7DTD, for example a boolean, port number, language code, or folder path.
2. Wait for the save result and allow the page to refresh its data. If the request fails, keep the previous value and resolve the reported validation or connectivity problem before retrying.
3. If several values are related, save and verify the first value before changing the next one. This makes a later regression attributable to one setting.

### Apply a live change

1. Check the setting's 7DTD behavior and decide whether a game-server restart is required. A setting being accepted by the API does not mean the running process has reloaded it.
2. Announce any expected disconnect, run the restart workflow when approved, and keep the pre-change configuration backup until the new state is proven.
3. If the change affects the dashboard or Telnet endpoint, update the reverse proxy, firewall, and operator connection details together.

## Verify the result

- Refresh **Server Config** and confirm the key displays the saved value and the expected description group.
- For a setting that requires a restart, confirm the game process returns online, the dashboard can still authenticate, and a representative player can connect.
- For a network or access change, test from the same network boundary used by operators and confirm the corresponding audit record exists.
- If the new value is not effective after restart, compare the active server configuration file with `<SERVER_CONFIG_FILE>` and restore the last known-good value before escalating.

## Limits and safety notes

::: warning
The page edits the configuration file or settings exposed by the backend. It does not validate every game-specific combination. Follow the 7DTD version's configuration rules and keep a known-good backup.
:::

::: danger
Changing `ServerPassword`, ports, Telnet credentials, dashboard endpoints, or file locations can lock out players or administrators. Use a second operator to review the target and never publish secrets, real hosts, or private paths.
:::

## Related pages

- [Feature modules](../game-and-player-management/feature-modules)
- [Application settings](./application-settings)
- [Restart](../automation-and-reliability/restart)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [API documentation](./api-documentation)
