---
outline: deep
---

# Terminology

> Shared vocabulary for the console, backend logs, audit evidence, and player investigations. Use these meanings when writing an incident note or escalation.

## Operational terms {#operational-terms}

| Term | Definition | Operator implication |
| --- | --- | --- |
| **Server** | The running 7 Days to Die game process and its world, players, console, and native save files. | A backend response does not prove that the game process has applied a change. |
| **Backend** | The ServerAdmin mod/API process that stores data, runs jobs, exposes Swagger, and communicates with the game process. | Check backend reachability, logs, and feature state before diagnosing the frontend. |
| **Frontend** | The browser-based administration console that calls the backend API. | Browser time, locale, and cached client code can affect display without changing server execution. |
| **Feature module** | A ServerAdmin capability that can be enabled, disabled, initialized, and permission-gated independently. | A missing menu or rejected request can be an intentional module state. |
| **Runtime state** | In-memory state held by the running backend or game process, such as registered jobs, cooldowns, pending restarts, and undo entries. | Restarting or reloading can rebuild it; do not treat it as durable history. |
| **Audit log** | A record of an administrator or system action with source, target, reason, result, and time when available. | Use it to attribute a change; redact identifiers when exporting evidence. |
| **Game event log** | A record of gameplay lifecycle events such as joins, leaves, chat, kills, or item-source events. | It explains what happened in the game and is separate from who changed an admin setting. |
| **Cron** | The five-field schedule expression used by a registered backend job, for example `0 5 * * *`. | The expression has no inherent time zone; pair it with `TimeZoneId` and validate the runtime history. |
| **Time zone** | The zone used to interpret a schedule and render a date, such as `UTC` or `Asia/Shanghai`. | An empty value may fall back to the server local zone; a browser can display another zone. |
| **Retention** | The policy that removes old history rows, logs, backups, or records after a configured period. | A missing old row may be retention, not a failed write; verify the configured period first. |
| **Snapshot** | A point-in-time copy of a player's or system's current state, such as inventory, profile, or metrics. | A snapshot answers “what was present then,” not necessarily “where each item was first created.” |
| **Acquisition record** | A record that attributes an item gain to a supported source event, quantity, time, and optional coordinate. | Use it as investigation evidence; a gap is not proof of unauthorized behavior. |
| **Loot container** | An entity-backed drop container, such as a zombie or other entity drop, that can be observed as an item source. | Coordinates can be recorded when the source event supplies them. |
| **Recovery** | The controlled process of restoring service or data from a backup, history, undo entry, or documented rollback. | Verify the artifact and target before applying recovery; record the operator and result. |

## Evidence terms {#evidence}

- **`NextRunAt`:** A calculated next-run timestamp shown by the API or UI. It is a display hint; the saved `CronExpression` and `TimeZoneId` determine scheduling.
- **`TriggerSource`:** The origin of a run, such as `Cron` or `Manual`, used to distinguish scheduled and operator-triggered actions.
- **Run history:** The status and detail rows for restart, scheduler, backup, or event-automation executions. A suppressed event may intentionally have no row.
- **Player tracking:** The acquisition view in a player workflow. It focuses on supported item-source observations and does not follow every later transfer or stack merge.
- **Source coordinate:** The location supplied by a supported source event. It can be empty when the game or a mod does not expose a reliable position.

## Usage rules {#usage-rules}

1. Name the source of evidence: audit log, game event log, run history, snapshot, or live-server check.
2. Record the applicable time zone alongside any schedule or timestamp.
3. Separate a missing observation from a confirmed negative result. Keep the escalation boundary explicit.

## Related pages

- [Console menu index](./console-menu-index)
- [Administrator commands](./administrator-commands)
- [Troubleshooting](./troubleshooting)
