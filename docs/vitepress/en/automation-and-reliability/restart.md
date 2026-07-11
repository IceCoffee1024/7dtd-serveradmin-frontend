---
outline: deep
---

# Server restart

> For administrators who can configure restart, run it manually, and read run history. The backend must be published and able to reach the game process; a scheduled job is registered only while the feature is enabled.

## Purpose

Configure a restart that is announced and traceable, or request one during a maintenance window and confirm it with run history and audit records.

## Before you begin

- Confirm that the account can update restart settings, trigger a restart, and read run history.
- Confirm the maintenance window, player notice, backup, and rollback plan first. A restart disconnects online players.
- Set an explicit `Cron expression` and `TimeZoneId`. A blank time zone falls back to the server local time zone; do not infer the schedule time zone from a browser display.

```text
Cron: 0 6 * * *
TimeZoneId: Asia/Shanghai
```

## Procedure

### Settings {#settings}

1. Open Restart settings and decide whether to enable scheduled restarts. When disabled, no cron job is registered; the manual entry still depends on permission.
2. Enter a `Cron expression` and an explicit `TimeZoneId` such as `UTC` or `Asia/Shanghai`, then save and wait for the settings to reload. The saved pair is the authoritative schedule configuration.
3. Set the warning lead seconds, warning message, and optional multi-stage warnings. Messages can use `{minutes}`; multi-stage messages can also use `{seconds}`. A non-empty multi-stage list replaces the single warning.
4. Choose `Save world before restart`, `Graceful`, or `Force` for the maintenance policy. Enter a `Custom restart command` only when the external launcher requires one; a custom command bypasses the built-in restart pipeline.
5. To avoid a blood-moon window, enable scheduled deferral and set the pre-dusk protection hours and delay minutes. Save, confirm the success notice, and reload the settings to make sure the values were retained.

<a href="/images/en/automation-and-reliability/restart-settings.png" target="_blank" rel="noopener" title="Open full-size image">
  <img src="/images/en/automation-and-reliability/restart-settings.png" alt="Restart settings controls">
</a>

*Figure: View restart scheduling and related settings controls; use the values currently saved in your environment.*

### Run now {#run-now}

1. Open the manual restart page and enter an auditable reason. Override warning seconds or restart mode only for this run; leaving them blank uses the configured defaults.
2. In the confirmation dialog, confirm the online-player disconnect, target server, and maintenance window again, then select Run now. Cancelling the confirmation creates no run.
3. Read the returned status, summary, duration, and error message. During the countdown, Cancel pending restart is available from Settings; when no countdown exists it makes no change.
4. Wait for the game process to exit and return as expected. “Request sent” is not proof that the server has recovered.

### History {#history}

1. Filter History by `TriggerSource` (`Cron` or `Manual`), success, and time range to find the run.
2. Open its details and check `Status` (`Success`, `Failed`, or `Skipped`), `Summary`, `ErrorMessage`, start/end time, duration, operator, and source IP.
3. Compare the row with audit records, game-process logs, and the reconnect result. A blood-moon deferral, duplicate request skip, or countdown cancellation should be explained by the status and details.

## Verify the result

- After reload, enabled state, cron, time zone, and warning values match the saved values; a displayed `NextRunAt` is only a time point calculated from the active job.
- A manual run creates one `Manual` history row whose summary/error matches the response; after the restart, the server accepts a connection and the game log has no startup error.
- A scheduled run creates one `Cron` row. Treat `NextRunAt` as a display hint: the backend's saved `CronExpression` plus `TimeZoneId` (or the server local time zone when blank) determines the trigger.

## Limits and safety notes

::: warning
Restart depends on the backend cron process and game-process state. `Graceful` waits for an orderly shutdown, while `Force` can lose unwritten data; `saveworld` runs only when enabled and the game has started. A warning is a notice, not an execution lock.
:::

::: danger
Run now, force restart, and custom restart commands mutate live state. Confirm the target, maintenance window, backup, and rollback owner before execution; never put a real host, path, player identifier, or token in an example.
:::

- History retention automatically prunes old rows. Export audit evidence when longer retention is required instead of relying on the current table alone.

## Related pages

- [Console and logs](../daily-operations/console-and-logs)
- [Scheduler](./scheduler)
- [Backup and recovery](./backup-and-recovery)
- [Access control](../integrations-and-access/access-control)
- [Troubleshooting](../reference/troubleshooting)
