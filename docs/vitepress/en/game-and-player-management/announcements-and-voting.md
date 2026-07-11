---
outline: deep
---

# Announcements and voting

> For authenticated administrators who manage player-facing notices and vote policies. Requires a reachable backend, a ready game for live broadcasts/votes, and the Game Notice, Vote Restart, or Vote Kick module permission.

## Purpose

Publish predictable in-game notices and configure community votes with explicit thresholds, cooldowns, messages, and safety boundaries.

## Before you begin

- Confirm the selected module is enabled and its configuration is healthy in [Feature Modules](./feature-modules).
- Check the current server state, active votes, restart window, online-player count, and moderation policy before changing a live message or vote rule.
- Keep messages free of secrets and test placeholders with a non-production account when possible.

## Procedure

### Game notices {#game-notices}

1. In **Game notices**, edit the enabled switch, welcome messages, rotating message list and interval, and blood-moon notices. Save, reload, and trigger a safe test or wait for the next event to confirm delivery.

### Vote restart {#vote-restart}

2. In **Vote restart**, set the minimum votes/ratio, vote duration, global cooldown, command text, success/failure/cooldown messages, and restart warning. Save only after checking that a passed vote will use the intended maintenance workflow.

### Vote kick {#vote-kick}

3. In **Vote kick**, set vote threshold/duration, target immunity, global cooldown, reason, and player-facing messages. Confirm the target-selection and permission policy before allowing a vote to start.
4. Observe one controlled vote from the game chat or server event log. Record who started and participated, the final count/result, cooldown, and any restart or kick action before closing the incident.
5. To roll back a policy, disable the affected module or vote switch, save, and reload. This prevents new notices or votes; investigate any already-passed vote separately rather than assuming a setting change undoes a restart or kick.

## Verify the result

- Saved settings reload with the expected enabled state, lists, intervals, thresholds, and cooldowns.
- A test notice is visible to the intended audience, and a controlled vote reports its current count and final result in chat/logs.
- A passed restart or kick creates the corresponding restart/moderation/audit evidence; a failed or cooled-down vote leaves a clear reason without taking the action.

## Limits and safety notes

::: warning
Notices may be delivered globally and votes affect every online player. Keep placeholders valid, use UTC-aware maintenance planning, and remember that a configured vote does not guarantee the game can execute a restart or kick when dependencies are unavailable.
:::

::: danger
A passed restart disconnects players; a passed kick removes a player. Set conservative thresholds and cooldowns, announce disruptive actions, and never use vote settings to bypass administrator permission or moderation policy.
:::

## Related pages

- [Feature modules](./feature-modules)
- [Game chat](../daily-operations/game-chat)
- [Console and logs](../daily-operations/console-and-logs)
- [Restart](../automation-and-reliability/restart)
- [Players and the hidden Player Profile](../daily-operations/players)
