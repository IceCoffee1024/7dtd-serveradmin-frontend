# Console and logs

## Applicability, role, and prerequisites

This page is for administrators allowed to use Console and read audit and game-event records. Console shows only commands allowed by the backend; confirm command permissions, module state, and game-process availability first.

## Purpose

Run or verify only the necessary server commands under controlled permissions, then use audit and game-event records to establish a traceable fact chain.

## Console

1. Wait for the allowed-command list, then use autocomplete to read a command's description and help. An unknown command is not sent.
2. Enter a confirmed administrator command and submit it. The frontend sends `inMainThread: true`, so the backend can synchronously occupy the game main thread; use it only when main-thread semantics are required.
3. Read output tagged Error, Exception, Warning, Assert, or Log and record command, time, and result. Arrow-key history can refill a command, but re-check parameters and target before sending again.

Include a player command here only when an administrator needs to instruct or verify a workflow. For example, use a read-only query to confirm state; never copy a real player ID, IP, password, or token into a manual. Restart, kick, ban, item grant, teleport, `saveworld`, and setting commands mutate state and belong in the relevant management page or controlled runbook.

## Audit logs

Filter by keyword, time range, Source (Api, ChatCommand, ConsoleCommand, System), Operator, Action Type (Create, Update, Delete, Enable, Disable, Execute, Send, Kick, Ban, Restart, and others), resource type/ID, and Succeeded. Inspect `errorMessage`, operator, summary, and createdAt. A failed row is an investigation fact; “request sent” is not a success proof.

## Game event logs

Filter by keyword, player/target player, event type, and time range for PlayerLogin, PlayerJoined, PlayerLeft, PlayerDied, PlayerKilledZombie, and PlayerKilledPlayer. Open a player ID in Profile and combine the result with Chat History and Audit Logs to distinguish player behavior, a game event, and an administrator action.

## Observable verification

- Allowed commands, help text, and Console output load; one read-only command returns output without an exception.
- Audit Logs can find the test action by source/action/result and show operator, resource, and error details.
- Game Event Logs align with the player's timeline/chat; an administrator action in the same period remains an Audit row rather than a player activity.

## Limits and safety

- **Command authority**: the backend allow-list and Permission determine visibility and execution. Do not try to bypass policy through input.
- **Main thread**: `inMainThread: true` is not asynchronous. Rename, save, map-render, or expensive queries can block the game thread.
- **Side effects**: Console can change the world, players, configuration, or process. Back up first, confirm target, maintenance window, and rollback plan; run dangerous commands only with explicit authorization.
- Logs depend on enabled modules, retention, and database availability. When records are missing, check backend errors and the time range first.

## Related pages

- [Players and Player Profile](./players)
- [Game Chat](./game-chat)
- [Access control](../integrations-and-access/access-control)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
