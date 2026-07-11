---
outline: deep
---

# Console and logs

> For administrators allowed to use Console and read audit and game-event records. Requires command permission, enabled modules, and a reachable game process; Console shows only commands allowed by the backend.

## Purpose

Run or verify only the necessary server commands under controlled permissions, then use audit and game-event records to establish a traceable fact chain.

## Before you begin

- Confirm the account can read the required audit and game-event records and can use only the intended Console commands.
- Prepare a read-only test command, a time range, and a stable player or resource identifier for log searches.
- For state-changing commands, confirm the maintenance window, backup, target, and rollback plan before opening Console.

## Procedure

### Console

1. Wait for the allowed-command list, then use autocomplete to read a command's description and help. An unknown command is not sent.
2. Enter a confirmed administrator command and submit it. The frontend sends `inMainThread: true`, so the backend can synchronously occupy the game main thread; use it only when main-thread semantics are required.
3. Read output tagged Error, Exception, Warning, Assert, or Log and record command, time, and result. Arrow-key history can refill a command, but re-check parameters and target before sending again.

Include a player command here only when an administrator needs to instruct or verify a workflow. For example, use a read-only query to confirm state; never copy a real player ID, IP, password, or token into a manual. Restart, kick, ban, item grant, teleport, `saveworld`, and setting commands mutate state and belong in the relevant management page or controlled runbook.

### Audit logs

Filter by keyword, time range, Source (Api, ChatCommand, ConsoleCommand, System), Operator, Action Type (Create, Update, Delete, Enable, Disable, Execute, Send, Kick, Ban, Restart, and others), resource type/ID, and Succeeded. Inspect `errorMessage`, operator, summary, and createdAt. A failed row is an investigation fact; “request sent” is not a success proof.

### Game event logs

Filter by keyword, player/target player, event type, and time range for PlayerLogin, PlayerJoined, PlayerLeft, PlayerDied, PlayerKilledZombie, and PlayerKilledPlayer. Open a player ID in Profile and combine the result with Chat History and Audit Logs to distinguish player behavior, a game event, and an administrator action.

## Verify the result

- Allowed commands, help text, and Console output load; one read-only command returns output without an exception.
- Audit Logs can find the test action by source/action/result and show operator, resource, and error details.
- Game Event Logs align with the player's timeline/chat; an administrator action in the same period remains an Audit row rather than a player activity.

## Limits and safety notes

::: warning
The backend allow-list and Permission determine command visibility and execution. `inMainThread: true` is not asynchronous, and logs depend on enabled modules, retention, and database availability.
:::

::: danger
Console can change the world, players, configuration, or process. Back up first, confirm target, maintenance window, and rollback plan; run dangerous commands only with explicit authorization.
:::

- When records are missing, check backend errors and the time range first.

## Related pages

- [Players and Player Profile](./players)
- [Game Chat](./game-chat)
- [Access control](../integrations-and-access/access-control)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
