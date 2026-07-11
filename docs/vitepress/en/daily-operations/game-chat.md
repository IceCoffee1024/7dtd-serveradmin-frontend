---
outline: deep
---

# Game Chat

> For administrators operating chat. Requires the Chat core service and relevant modules; global/private sends, mutes, and colored profiles require administrator permission. Chat can contain personal information, so apply the configured retention policy.

## Purpose

Manage live chat, history queries, chat policy, and colored profiles without accidentally broadcasting to the wrong audience.

## Before you begin

- Confirm Chat and Colored Chat modules are enabled and the account has the required send, mute, and profile permissions.
- Refresh the online-player list before composing a private message, and prepare a test account or channel for settings changes.
- Review the retention policy before searching or changing chat history settings.

## Procedure

### Live chat

1. In Live Chat, filter All, Global, Whisper, or another registered channel and refresh the online-player list first.
2. With no player selected, the composer sends global chat. After selecting an online player, it shows Whisper and sends a private message. Before sending, check the target tag, player name, and Entity ID.
3. Confirm that the message appears in the expected channel and related audit/game-event record. Preserve an error message instead of retrying repeatedly and broadcasting duplicates.

### Chat history

Filter by keyword, Sender, Player ID, Channel, and a UTC time range; sort by time, sender, player ID, or channel. Selecting a stable Player ID or sender opens the hidden Player Profile. An empty result can mean retention, a disabled module, or a mismatched time range; it does not prove that live chat did not occur.

### Chat settings

Review the core-service switch, global/whisper server names, command prefixes, no-prefix command policy, separators, history-retention days, command exclusion, and whether registered command messages are hidden from global chat. For mute notifications and post-mute/unmute private/broadcast templates, use supported placeholders such as `{player}`, `{playerName}`, `{playerId}`, `{reason}`, and `{mutedUntil}`. Save, then send one test message to compare preview and actual channel.

### Colored chat

In Settings, set the module switch, default channel colors, and player color-tag permission (None, All Players, or Admins Only). In Profiles, use a stable Player ID for a custom name, name color, text color, and note. Verify with one test player before allowing color tags broadly.

## Verify the result

- A live message appears in the intended channel; private chat is visible only to the target, and the refreshed player remains the same stable ID.
- Chat History filters return the new message at the expected time, and Player Profile shows the corresponding Chat activity.
- Settings persist after reload; retention, command-prefix, and color rules agree with Feature Modules state and invalid input produces validation feedback.

## Limits and safety notes

::: warning
Global messages and no-prefix commands increase the chance of accidental execution. Use an explicit prefix and a test account before production changes. Chat history retention `0` means keep indefinitely, increasing sensitive-data retention; check policy and database capacity before changing it.
:::

::: danger
Color tags, mute notifications, and administrator actions affect players. Record the reason and review Audit Logs after each change.
:::

## Related pages

- [Players and Player Profile](./players)
- [Console and logs](./console-and-logs)
- [Access control](../integrations-and-access/access-control)
- [Troubleshooting](../reference/troubleshooting)
