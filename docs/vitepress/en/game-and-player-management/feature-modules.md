---
outline: deep
---

# Feature modules

> For authenticated administrators who can inspect module metadata and configuration. The backend must be reachable; changing a module also requires the feature's management permission and, where shown, a ready game server.

## Purpose

Use the module center to see which game and operations features are enabled, whether their configuration is healthy, what they are doing at runtime, and which dependencies may prevent a route or command from working.

## Before you begin

- Sign in with an account that can view feature-module definitions and change settings when needed.
- Confirm the backend and the game process are reachable. Some permissions and commands are marked as requiring an authenticated user, a ready game, an administrator, or an online player.
- Have the relevant feature page and a rollback value ready before changing a live module.

## Procedure

### Enablement

1. Open **Feature Modules** and refresh the module list. Filter by enabled, disabled, issues, or unavailable state, then open a module to inspect its key, health, enabled flag, configuration status, and last check time.
2. To enable or disable a feature, open its linked settings route, change the feature switch and required fields, and save. Return to the module center and refresh until the enabled flag and configuration status reflect the saved value.

### Configuration health

3. In the module detail drawer, read **Configuration** and **Health issues** before treating a green status as operational. Resolve invalid values, missing required settings, or stale checks in the linked settings route, then run the module's available refresh or action again.

### Runtime state

4. Open **Runtime State** in the detail drawer. Filter state records by category such as runtime, history, cooldown, reward, request, cache, or first-join, and inspect the updated timestamp and value. Use cleanup only for a named scope that you have confirmed is safe to remove.

### Dependency warnings

5. Review **Dependencies**, **Routes**, **Commands**, and **Permissions**. A dependency marked disabled or unavailable explains why a child route, command, or capability is not usable; enable or repair that dependency first, then recheck the dependent module.

## Verify the result

- The module row shows the intended enabled state, a healthy configuration status, and a recent checked-at time.
- Runtime State shows a current record or a successful empty state, and any cleanup result reports the requested scope and count.
- Dependency status and linked routes/commands no longer show an unresolved warning for the workflow you are about to use.

## Limits and safety notes

::: warning
Module health is a point-in-time backend check, not proof that every game hook is producing events. A disabled or unavailable dependency can make a route appear empty. Treat runtime values and timestamps as diagnostics and cross-check important incidents with audit or game-event logs.
:::

::: danger
Disabling a module stops new collection or command registration but normally does not erase its stored data. Cleanup and reset actions can delete state; confirm the scope, retain the result, and make changes during a maintenance window.
:::

## Related pages

- [Game items](./game-items)
- [Economy](./economy)
- [Teleport](./teleport)
- [Player tracking](./player-tracking)
- [Console and logs](../daily-operations/console-and-logs)
