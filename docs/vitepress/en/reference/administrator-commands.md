---
outline: deep
---

# Administrator commands

> For a server owner or administrator with console-command permission. These entries cover commands supplied by ServerAdmin that support moderation, diagnostics, maintenance, or recovery; they are not a general player command guide.

## Scope and safety {#scope}

The short command aliases below are the current mod entry points; some commands also expose longer aliases in the game server. A command may be typed in the game console or sent through the [Console](../daily-operations/console-and-logs#console) workflow when the caller has the corresponding permission. Use a stable player identifier where possible, and keep the reason, target, and result in the audit record.

::: warning
The command output is an execution signal, not proof that a remote client or game process completed the side effect. Recheck the affected player, world, history, or server log after any mutating command.
:::

## Before you begin {#before}

1. Confirm that the backend is reachable and the account can access the Console workflow.
2. Identify the target with `<PLAYER_ID>`, `<PLAYER_NAME>`, `<ENTITY_ID>`, or coordinates. Do not paste a real identifier into a shared ticket or documentation example.
3. For a destructive action, announce the maintenance window, take a backup when applicable, and record a reason before execution.
4. Run a read-only diagnostic first when the target or syntax is uncertain.

## Command reference {#commands}

The `State` column describes the command's intended effect. `Audit` identifies the evidence to check; commands that predate the audit helper may only have console or game-log evidence.

| Command and syntax | Scope and required input | Expected output | Audit and state |
| --- | --- | --- | --- |
| `ty-cbt [<X> <Y> <Z>]` or `ty-CheckBlockType` | Read the block under the sender or at coordinates. | Block position, type, and name. | Console evidence; read-only. |
| `ty-gm <Message> <SenderName>` | Broadcast a message to connected clients. | A send result or an error for invalid input. | Audit `GlobalMessage`; changes player-visible chat. |
| `ty-pm <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <Message> <SenderName>` | Send a private message to one online player. | Target resolution and send result. | Audit `PlayerMessage`; changes player-visible chat. |
| `ty-gi <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <ItemName> [Count] [Quality] [Durability] [ModsCsv]` | Grant an item; `all` can target all players. | Grant result; a full inventory can drop the item to the ground. | Audit when available; mutates inventory or world items. |
| `ty-rpi <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <ItemName> [Toolbelt\|Backpack] [SlotIndex]` | Remove matching items or one slot from a player. | Removal count or a target/syntax error. | Audit resource `PlayerInventory`, action `Revoke`; destructive inventory mutation. |
| `ty-rplc <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME>` or `ty-rplc <X> <Y> <Z>` | Remove a player's claims or a claim at coordinates. | Removal result or a target-not-found error. | Audit when available; mutates land-claim ownership. |
| `ty-rpp <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME>` | Reset the native 7DTD profile. | Confirmation/result from the reset operation. | Audit resource `PlayerProfile`, action `Reset`; irreversible without a native save backup. |
| `ty-rs [<delay>] [-f\|force]` | Request a restart, optionally delayed or forced. | Request, countdown, or duplicate-request status. | Audit `Restart`; disconnects players and mutates live server state. |
| `ty-setcvar <cvarName> <cvarValue>` or `ty-setcvar <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <cvarName> <cvarValue>` | Set a custom variable for the sender or an online player. | Variable assignment or player-not-found error. | Audit `PlayerCustomVar`; mutates live player state. |
| `ty-re <ENTITY_ID>` or `ty-RemoveEntity <ENTITY_ID>` | Remove one game entity by entity ID. | Entity removal result or an error. | Audit when available; destructive world mutation. |
| `ty-pb <blockIdOrName> <X> <Y> <Z>` | Place one block at coordinates. | Placement result or a block lookup error. | Audit when available; mutates world blocks. |
| `ty-fb <blockIdOrName> <X1> <Y1> <Z1> <X2> <Y2> <Z2>` | Fill a region with a block; the command also supports stored-position workflow. | Region or argument validation result. | Audit when available; bulk world mutation. |
| `ty-pp <prefabFileName> <X> <Y> <Z> [noSleepers] [addToRWG]` | Place a prefab at a location; position and flags are optional in the in-game workflow. | Placement result and location. | Audit when available; bulk world mutation. |
| `ty-da <X1> <Y1> <Z1> <X2> <Y2> <Z2> <X> <Y> <Z> [rot]` | Duplicate a region; `p1` and `p2` store positions for an interactive workflow. | Source, destination, and rotation result. | Audit `WorldBlockArea`; bulk world mutation. |
| `ty-ep <X1> <Y1> <Z1> <X2> <Y2> <Z2> <prefabFileName> [overwrite]` | Export a region to `LocalPrefabs`; the filename is operator-controlled. | Export path/name or an existing-file error. | Console evidence; writes a server-side prefab file. |
| `ty-up [<id>]` | Undo the selected recent prefab, fill, block, or duplicate operation. | Restored location or no-undo-entry error. | Audit `WorldPrefabUndo`; mutates world state and consumes the undo entry. |
| `ty-sus [<size>]` | Read or set the in-memory undo history size; `0` or less clears it. | Current size or cleared-history result. | Console evidence; setting `0` removes recovery options for the session. |
| `ty-ReloadAllXmls` | Reload supported game XML files synchronously. | Reload completion or console error. | Console/game-log evidence; changes runtime definitions. |
| `ty-gc` | Run the framework garbage-collection helper. | Completion or console error. | Console evidence; no intended persistent game mutation. |

## Verify the result {#verify}

1. Read the returned output and record the command, target, reason, and timestamp.
2. Open [Audit Logs](../daily-operations/console-and-logs#audit-logs) and confirm the expected action, target, operator, and source. For commands without an audit row, use the Console or game log.
3. Re-read the affected workflow: the player profile, inventory, land claim, world location, restart history, or server process must show the expected state.
4. If output and state disagree, stop issuing retries and follow [Troubleshooting](./troubleshooting).

## Limits and safety notes {#limits}

::: danger
`ty-rpp`, `ty-rpi`, `ty-rplc`, `ty-re`, world-editing commands, forced restart, and `overwrite` can destroy or replace data. Take a verified backup and obtain a second-person confirmation before running them on a live server.
:::

::: tip
The `ty-gi` command is an administrator grant, not a player acquisition source. When item acquisition tracking is enabled, distinguish an administrator grant from a loot-container or ground-pickup source during an investigation.
:::

Vanilla 7 Days to Die commands and commands supplied by other mods are outside this page. Use the game console's own `help <command>` output and the owning mod's documentation; do not assume that a command shown here exists after a module is disabled.

## Related pages

- [Console menu index](./console-menu-index)
- [Console and logs](../daily-operations/console-and-logs)
- [Access control](../integrations-and-access/access-control)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](./troubleshooting)
