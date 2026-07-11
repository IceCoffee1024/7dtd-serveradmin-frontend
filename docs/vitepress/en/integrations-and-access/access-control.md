---
outline: deep
---

# Access control

> For administrators who manage player bans, whitelist entries, mutes, administrator accounts, and command permission rules. These changes affect live players and require the corresponding game-server permission.

## Purpose

Apply the smallest access rule needed, test it with a dedicated account, and retain enough context to reverse the rule safely.

## Before you begin

- Confirm the target player ID from a trusted player record. Use a sanitized placeholder such as `<PLAYER_ID>` in tickets and screenshots.
- Decide whether the action is a temporary restriction, permanent restriction, allow-list entry, mute, administrator grant, or command rule.
- Record the reason, operator, expiry, and approval before changing a live rule.
- Keep a second administrator available when changing the only administrator account or a command needed for recovery.

## Procedure

### Ban and whitelist {#ban-and-whitelist}

1. Open **Ban and Whitelist**. The tabs are **Ban**, **Whitelist**, and **Mute**; use the tab that matches the intended scope.
2. Search by player ID or display name. For a ban, enter the player ID, display name, expiry time, and a reason. For a whitelist entry, enter the player ID and display name. For a mute, set its expiry and reason in the Mute tab.
3. Save the entry and wait for the command result. When editing, the UI removes the old rule before writing the replacement, so verify that the new rule was accepted before leaving the page.
4. Use the row action for a single removal or select rows for a confirmed batch removal. Re-check the selection immediately before confirming a destructive action.

### Permissions {#permissions}

1. Open **Permissions** and choose **Admin User** to grant a player an administrator permission level, or **Command Permission** to set the minimum level for a console command.
2. For an administrator entry, enter a SteamID64 or an ID beginning with `Steam_` or `EOS_`, a display name, and a permission level from `0` through `2000`. Higher values usually mean more privileges in the game server's permission model.
3. For a command rule, enter the command name and required permission level. Keep the description in the change record even though the current form treats it as an operator note.
4. Save, reload the table, and verify the effective rule with a dedicated test account. Do not test a new administrator level with the account that owns the only recovery path.
5. To reverse a rule, remove the selected entry or replace it with the approved level, then confirm that a previously permitted or denied command now produces the expected result.

## Verify the result

- A ban, whitelist, or mute table row shows the intended player ID, display name, expiry, and reason.
- A test account receives the expected login or chat result. Test both the positive case and the neighboring negative case, such as a non-whitelisted account.
- The administrator or command permission table shows the expected level after refresh, and the action appears in the audit log or game command history available for the server.
- Removing an entry permits the intended recovery path; do not infer success from a stale browser row.

## Limits and safety notes

::: warning
Permission level ordering is a game-server policy, not a universal role name. Confirm the effective level with a test account and avoid granting more access than the task requires.
:::

::: danger
Ban, mute, batch removal, and administrator changes are live state changes. A wrong player ID can affect the wrong person, and removing the only admin can make recovery impossible. Require confirmation and retain the previous rule before editing.
:::

- A whitelist or ban entry is not an identity-proofing system. Verify the player ID from the server's trusted record and protect exported lists as personal data.

## Related pages

- [Player list and profile](../daily-operations/players)
- [Console and logs](../daily-operations/console-and-logs)
- [Server configuration](./server-configuration)
- [Discord integration](./discord-integration)
