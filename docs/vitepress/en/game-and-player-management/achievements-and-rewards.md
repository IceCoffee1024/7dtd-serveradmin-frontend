---
outline: deep
---

# Achievements and rewards

> For authenticated administrators with achievement and economy/reward-management permission. The Achievement module must be enabled; economy, game-item, and command dependencies are required only for the reward types you configure.

## Purpose

Define measurable milestones, review who earned them, and configure online-time rewards without granting duplicate or untested value.

## Before you begin

- Check module health and dependency warnings in [Feature Modules](./feature-modules).
- Decide the trigger and threshold, the one-time or repeat behavior expected by the server, and the exact reward/message payload before editing a definition.
- Test item, economy, and restricted console-command payloads on a disposable player where possible.

## Procedure

### Achievement definitions {#achievement-definitions}

1. In **Achievement definitions**, add or edit the name, description, trigger type (`Level`, `ZombieKills`, `PlayerKills`, `Deaths`, or `GameStage`), threshold, sort order, enabled state, economy amount, player/broadcast messages, and restricted console commands.
2. Save the definition, reload the table, and confirm the persisted ID, trigger, threshold, enabled flag, and reward fields. Disable a definition before changing a threshold during an active event.

### Achievement records {#achievement-records}

3. In **Achievement records**, filter by achievement or Player ID/name and inspect earned time, reward amount, and player identity. Use a record delete/reset only with a documented correction; understand that the condition may grant it again later.

### Achievement settings {#achievement-settings}

4. In **Achievement settings**, enable or disable processing and save. In **Online rewards**, set the enabled state, interval, amount, partial-period policy, and player message; reload both pages after saving.

### Online rewards {#online-rewards}

5. Run one controlled trigger or online interval with a test player. Compare the player message, economy transaction/item delivery/command result, achievement record, and module runtime state before enabling the policy for everyone.

## Verify the result

- The definition and settings pages reload with the intended persisted values and no dependency warning.
- A controlled trigger creates exactly one expected record and matching reward evidence; an online interval records the configured amount and message without an unexpected duplicate.
- A failed reward is visible as an error or missing result to investigate, not silently treated as success.

## Limits and safety notes

::: warning
Definitions and records are separate: deleting a definition can remove its earn history, while deleting an earn record can allow a later re-grant. Economy and command rewards may depend on other modules and server permissions; an enabled definition is not proof that delivery succeeded.
:::

::: danger
Achievement thresholds, online rewards, and console commands can create large or repeated grants. Use least privilege, conservative test values, explicit `allowUnsafe`/allowed-command policy where applicable, and retain the transaction/audit evidence.
:::

## Related pages

- [Feature modules](./feature-modules)
- [Economy](./economy)
- [Game items](./game-items)
- [Players and the hidden Player Profile](../daily-operations/players)
- [Player tracking](./player-tracking)
