# Dashboard

## Applicability, role, and prerequisites

This page is for signed-in administrators and on-call operators. The backend must be reachable and the account must be allowed to read game-server statistics and system metrics. When data is empty or its timestamp is stale, start with [Frontend and backend publishing](../getting-started/publishing).

## Purpose

Dashboard is the duty entry point: decide whether the server is online, whether samples are fresh, and whether resources look abnormal, then follow the shortest investigation path. It is not a frame-by-frame profiler and does not replace audit or game-event logs.

## Main areas

- **Status and overview**: online/offline state, online players and maximum, FPS, and server version/region/language and game-time summary.
- **Resource monitoring**: resident memory, heap, CPU/RAM/network samples, and counts for chunks, entities, items, zombies, and animals.
- **Freshness**: system sample time, uptime, and the next scheduled restart when configured. During refresh, time and values should change; an unknown value must not be interpreted as zero.
- **Recent activity**: summaries such as players entering or leaving, which can lead to Player, Game Event, or Chat pages.
- **Quick actions**: refresh, restart, or other entries exposed by the page. Restart interrupts connections and belongs in a maintenance window.

## Procedure

1. After login, read online/offline state and sample time. If offline, check the backend and game process before clicking restart again.
2. Compare FPS, memory, heap, chunks, and entities and note when an anomaly began. One card is not enough to identify a cause.
3. Open the related player or log page from Recent Activity and narrow by player ID, time range, and event type.
4. Before maintenance, confirm the player notice, backup, and permission plan. Use a quick action only then, and return to Dashboard until samples recover.

## Observable verification

- Across two refresh cycles the sample time or values update; online-player count is broadly consistent with Player List.
- A temporary backend outage produces a clear error/empty state, and a refresh returns real values after recovery.
- After a restart, status returns from offline to online and FPS/memory cards return; restart or error records are visible in [Console and logs](./console-and-logs).

## Limits and safety

- Dashboard values are scheduled backend samples and can lag. Confirm important incidents in console and game logs.
- The browser formats some times in its local zone; scheduled execution uses the Scheduler/Backup time-zone settings.
- Restart disconnects players. Do not confuse refresh with restart or repeat a restart while another operator is acting.

## Related pages

- [Players and Player Profile](./players)
- [GPS Map](./gps-map)
- [Game Chat](./game-chat)
- [Console and logs](./console-and-logs)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
