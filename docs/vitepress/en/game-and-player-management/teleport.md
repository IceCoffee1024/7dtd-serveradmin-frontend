---
outline: deep
---

# Teleport

> For authenticated administrators with teleport-management permission. The Teleport module and the selected submodule must be enabled; the game must be ready and targets must be online for live tools.

## Purpose

Operate and audit player movement through direct tools, configurable home/city/friend/back services, and a searchable history of teleport attempts and costs.

## Before you begin

- Check module and submodule health in [Feature Modules](./feature-modules), then confirm the target's stable Player ID or current online Entity ID.
- Confirm destination coordinates, currency costs, blood-moon policy, per-submodule cooldowns, and any global cooldown before moving a player.
- Use a maintenance or incident window for forced movement and keep the resulting log entry.

## Procedure

### Tools {#tools}

1. In **Tools**, refresh online players, choose **Teleport to position** or **Teleport to player**, enter coordinates or source/target players, and read the confirmation dialog before submitting.

### Settings {#settings}

2. In **Settings**, enable only the needed submodules and set home/city/friend/back permissions, costs, request expiry, home limits, blood-moon rule, command names, and cooldowns. If global cooldown is enabled, account for its shared pool across teleport types.

### Cities {#cities}

3. In **Cities**, add or edit a named destination with coordinates, yaw, optional currency cost, enabled state, and sort order. Disable a destination before changing it during a live event; delete only after confirming no player-facing command depends on it.

### Homes {#homes}

4. In **Homes**, search by stable Player ID. Review home names, coordinates, owner, and creation time; delete a home only after confirming the player and reading the delete confirmation.

### Logs {#logs}

5. In **Logs**, filter by Player ID and UTC time range. Compare timestamp, Home/City/Friend/Back subsystem, from/to coordinates, cost paid, remark, and linked player profile with the incident timeline.

## Verify the result

- A successful tool action reports success and the target's next position or player view matches the requested destination.
- Settings reload with the intended enabled flags, limits, costs, and cooldowns; a blocked request displays the expected permission, cooldown, currency, or blood-moon reason.
- A log row records the player, subsystem, from/to coordinates, cost, result/remark, and UTC timestamp.

## Limits and safety notes

::: warning
Teleport is disruptive and coordinate mistakes can strand a player or place them in unsafe terrain. A permission to open the page does not bypass submodule, game-ready, online-player, currency, or cooldown checks. Treat Entity IDs as session-scoped and revalidate after reconnects.
:::

::: danger
Forced teleports and home deletion change player state. Confirm the target and coordinates twice, avoid moving players during combat or irreversible events, and retain the log/audit evidence. Do not share exact private home coordinates outside the incident team.
:::

## Related pages

- [Feature modules](./feature-modules)
- [Players and the hidden Player Profile](../daily-operations/players)
- [GPS Map](../daily-operations/gps-map)
- [Economy](./economy)
- [Console and logs](../daily-operations/console-and-logs)
