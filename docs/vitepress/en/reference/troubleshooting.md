---
outline: deep
---

# Troubleshooting

> For administrators investigating a failed workflow. Start with shared prerequisites, then follow the branch that matches the observable symptom. Every branch ends with a verification signal or an escalation boundary.

## Common decision flow {#flow}

1. **Reachability:** Open the frontend and request `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`. A reachable backend returns HTTP `200` with non-empty JSON.
2. **Authentication:** Sign in again and confirm the account has not expired or been disabled. A `401` is an identity/session problem, not a feature failure.
3. **Feature module state:** Open Feature Modules and confirm the relevant module is enabled and initialized. A disabled module may hide settings or reject requests by design.
4. **Permission:** Compare the account role with the action. A `403` should be fixed through Access Control, not by retrying the same request.
5. **Configuration:** Re-read the saved value, including `CronExpression`, `TimeZoneId`, destination roots, retention, and integration endpoints. Do not infer a server setting from a browser label.
6. **History or audit evidence:** Check the matching run history, audit log, game event log, and backend log for the same UTC/local time window.
7. **Live-server verification:** Confirm the game process, network connection, player-visible result, or generated artifact. A successful HTTP response only proves that the backend accepted the request.

If a step fails, record the status, timestamp, sanitized request identifier, and the next owner before escalating. Never include a real token, password, IP address, Discord secret, player identifier, or server path in a ticket.

## Restart timing or an unexpected dashboard time {#restart-timing}

**Symptom:** `Cron: 0 5 * * *` is saved, the restart itself happens at the expected time, but the dashboard shows a different time such as 13:00.

1. Read the saved `CronExpression` and `TimeZoneId` in Restart settings. A cron expression alone has no time zone.
2. If `TimeZoneId` is blank, identify the backend server's local time zone. If it is `UTC` while the browser is in `Asia/Shanghai`, a display can differ by eight hours; do not edit the expression to compensate.
3. Reload the page and compare the display with `NextRunAt`, the last `Cron` history row, and the game-process log. Treat `NextRunAt` as a calculated display hint, not the schedule authority.
4. Confirm the next run against the configured time zone and the recorded `TriggerSource`, then compare the actual reconnect time.

**Verify or escalate:** The saved expression plus explicit time zone, the history row, and the server log agree. If the actual trigger is correct but only the display is offset, capture the values and browser time zone for a frontend date-formatting issue. If the runtime trigger disagrees with the saved pair, escalate to backend scheduler/runtime ownership.

## Scheduler failure {#scheduler-failure}

**Symptom:** A scheduled task does not run, runs at the wrong time, or has a failed history row.

1. Confirm Scheduler and the task itself are enabled, the Cron expression parses, and the task's `TimeZoneId` is explicit.
2. Check the task's next-run value, history status, error message, and the backend log around the scheduled instant.
3. Verify that the action's feature module and permission are available. A task can be accepted by the scheduler and still fail at the action boundary.
4. Run the same action manually in a maintenance window and compare its audit or history record.

**Verify or escalate:** A manual run succeeds and the next scheduled run produces one matching history row. If no task is registered after a reload, or the manual action also fails, escalate with the task ID, sanitized payload, history row, and backend log timestamp.

## Backup failure or missing artifact {#backup}

**Symptom:** A backup run is failed, completes without a usable file, or history is empty.

1. Confirm Backup is enabled and read `TimeZoneId`, retention, and each destination setting. Use a placeholder such as `<7DTD_SERVER_ROOT>` when discussing paths.
2. Verify the backend service identity can create and write the destination, the volume has free space, and the game process is in the expected state.
3. Run one backup task manually. Inspect the returned status, `BackupHistory` row, file size, timestamp, and checksum or archive-open result.
4. Check whether retention cleanup removed the artifact; do not treat an intentional retention result as a write failure.

**Verify or escalate:** A manual run creates a non-empty artifact that can be opened and has a matching history row. If the task fails before writing, or the file is corrupt after a successful status, escalate with the destination type, run ID, error text, and storage-owner result without exposing the real path.

## Discord connection or delivery {#discord}

**Symptom:** Discord status is disconnected, notifications do not arrive, or commands are not acknowledged.

1. Confirm the Discord module is enabled and the bot configuration is present, masked, and assigned to the intended guild/channel.
2. Check network/DNS access to Discord and the backend log for HTTP status, rate limiting, gateway, or permission errors.
3. Send a test notification to a sanitized test channel. Verify the bot role can view, send, and embed messages as required.
4. For inbound commands, confirm the command prefix, account binding, and administrator permission; do not use a real token in a test or ticket.

**Verify or escalate:** A test message arrives with the expected locale and no duplicate sends, and the health/status view remains connected. If Discord returns authorization or gateway errors after role and network checks, escalate to the Discord integration owner with only the status code, timestamp, guild/channel placeholders, and correlation ID.

## GeoIP lookup or access decision {#geoip}

**Symptom:** A client is blocked or allowed unexpectedly, or the recent decision has no country/region.

1. Confirm GeoIP Access Control and its settings are enabled, including the lookup provider/database and fail-open or fail-closed policy.
2. Determine which client address the backend received. A reverse proxy may require trusted forwarding configuration; do not publish the real address.
3. Query recent decisions and compare the result with the configured allow/deny rule, cache age, and lookup error.
4. Test with a dedicated, sanitized client or provider test result instead of changing production rules during an incident.

**Verify or escalate:** The decision row shows the expected policy, source classification, and lookup status. If the provider returns no data or the proxy address is wrong, escalate to the GeoIP provider or network owner with a redacted decision ID and configuration version.

## Event automation run failure or missing history {#event-automation}

**Symptom:** A rule does not run, an action fails, or Run History has no row.

1. Confirm the module and rule are enabled and that the trigger is one of the current MVP events: `PlayerJoined`, `PlayerLeft`, `ChatMessage`, or `Cron`.
2. Check conditions, target scope, action configuration, permission, and the rule's time zone where applicable.
3. Check Run History, audit logs, chat/Discord output, and backend logs together. Cooldown or first-join suppression may intentionally create no RunLog; Cron overlap suppression can also be silent.
4. Trigger a single test event with test data and wait for the configured cooldown before repeating it.

**Verify or escalate:** The expected action is observable and, when a run is recorded, its status and details match the test. If a supported event is received but no action occurs after suppression and permission checks, escalate with rule ID, trigger timestamp, sanitized condition/action, and module state.

## Player tracking data gap {#player-tracking}

**Symptom:** A player's inventory item has no acquisition record, source coordinate, or expected container entry.

1. Confirm Player Tracking is enabled and the player profile's tracking tab is loaded for the correct player and time range.
2. Look for the supported source types: an entity drop container or a ground pickup. Coordinates are recorded when the source event provides them.
3. Treat stack merges, transfers, crafting, and unsupported mod flows as identity boundaries. They may not produce a permanent item identity or a new acquisition row.
4. Compare the record with game event logs, item grant/audit records, and the player's snapshot. A missing row is an investigation lead, not proof of cheating.

**Verify or escalate:** A supported drop or pickup shows item, quantity, source type, timestamp, and coordinate when available. If a supported event is missing consistently, escalate with a sanitized player reference, item key, event time, module version, and relevant log correlation; do not infer a cheat from a gap alone.

## Swagger or generated API client mismatch {#swagger-api}

**Symptom:** Swagger is blank or unreachable, generated requests have the wrong shape, or the frontend receives `404`, `401`, `403`, or `5xx` after a publish.

1. Request `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json` and record the HTTP status and whether the body is non-empty JSON.
2. Confirm the backend publish target, reverse-proxy base path, CORS/auth settings, and frontend `SERVERADMIN_API_BASE_URL` agree. A browser route alone does not prove the API base is correct.
3. After the backend contract is reachable, run `pnpm api:gen`, then `pnpm typecheck` and `pnpm locale:check` from the frontend repository.
4. Reopen the generated operation in Swagger and execute a non-destructive authenticated request. Keep credentials in environment variables and redact them from output.

**Verify or escalate:** Swagger returns a non-empty current contract, the generated types match the response, and a read-only request returns the expected `2xx`. If the backend contract itself is empty or the proxy still rewrites it, escalate to the publish/proxy owner with status, path, and build version only.

## Related pages

- [Console menu index](./console-menu-index)
- [Restart](../automation-and-reliability/restart)
- [Scheduler](../automation-and-reliability/scheduler)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Event automation](../automation-and-reliability/event-automation)
- [Player tracking](../game-and-player-management/player-tracking)
- [API documentation](../integrations-and-access/api-documentation)
