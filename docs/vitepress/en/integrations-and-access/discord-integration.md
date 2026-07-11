---
outline: deep
---

# Discord integration

> For administrators and operators who can update the Discord feature, send test messages, inspect Bot diagnostics, and read audit records. Inbound chat and command relay are disabled unless explicitly enabled.

## Purpose

Connect notifications, chat bridges, controlled command relay, account binding, and event-automation failure alerts while keeping Discord credentials and high-risk commands outside the browser's public surface.

## Before you begin

- Create a Discord application and Bot in the Discord Developer Portal. Grant only the channel permissions required for the chosen features; enable Message Content Intent when using prefix commands or inbound chat.
- Separate a public channel for chat and low-risk notifications from an administrator channel for command results. Use an optional audit channel for sensitive alerts.
- Prepare test channels and a dedicated test player. Use placeholders such as `<DISCORD_GUILD_ID>`, `<DISCORD_PUBLIC_CHANNEL_ID>`, and `<DISCORD_ADMIN_CHANNEL_ID>` in tickets.
- Have a proxy and firewall owner available if the server cannot reach Discord directly.

::: danger
Bot tokens, webhook URLs, proxy passwords, binding codes, and channel identifiers are secrets or sensitive identifiers. Enter them only in the protected settings form. Never place them in screenshots, Markdown code blocks, browser environment variables, logs, or Git.
:::

## Procedure

### Settings {#settings}

1. Open **Discord Integration** and start on **Overview**. Enable notifications only after a test webhook target and a rollback plan exist.
2. In **Webhooks & channels**, enter the default webhook or named targets such as `public`, `admin`, and `audit`. Keep each target disabled until the channel owner has approved the destination.
3. In **Chat bridge**, enable game-to-Discord forwarding and select a target key. Enable Discord-to-game chat only when the public channel and moderation owner are ready; keep whisper forwarding disabled unless it is explicitly needed.
4. In **Bot & commands**, enable Bot integration, enter the Guild ID and separate public/admin channel IDs, then save. Enable slash-command management only after the Bot is online. Enable command relay only with a minimal allow-list of read-only commands where possible.
5. In **Account binding**, enable binding when Discord commands need a second identity check. Create a short-lived one-time binding code for the player ID and display name, then give it to the intended player or administrator through a private channel. In the **Redeem binding code** form, enter the code together with the Discord user ID and username and submit it. A successful redeem creates the binding; an expired or already redeemed code is rejected. Record only the code prefix in an audit note because the raw code is shown once.
6. In **Alerts & diagnostics**, choose a webhook target for event-automation failures and configure a concise message template. Run relay tests only against the dedicated test channels.
7. Save settings before each test. The test actions use saved settings, and the page prompts before testing unsaved changes.

### Network diagnostics

1. Open the proxy section and enable an HTTP/HTTPS proxy only when required by the deployment. Use `<DISCORD_PROXY_URL>` as a placeholder in documentation.
2. Run diagnostics and inspect proxy TCP, Discord REST API, Bot real-time connection, and the alternate proxy tunnel result.
3. A default WebSocket check can fail in some 7DTD or Unity runtimes while the alternate proxy path remains usable. Treat the integration as usable only when the diagnostic result and the Bot runtime status agree.

### Commands and slash commands

1. Keep the command allow-list small. `listplayers` is a suitable read-only starting point; built-in `!serverstatus` and `!help` are handled by the Bot and do not require the console allow-list.
2. Treat `!listplayers` and any other relayed command as a real console action. Verify the admin channel filter, prefix, allow-list, account binding, and audit behavior before enabling it for operators.
3. Save, run **Test Bot**, refresh Bot status, and use **Sync slash commands**. The current built-in slash commands are `/listplayers`, `/serverstatus`, and `/help`.

## Verify the result

- The Gateway runtime `state` is **Connected**, the separate `isReady` indicator is true, and diagnostics show the required Discord checks as passed. `Ready` is a Gateway event/readiness flag, not a second `state` value; a Connected session with `isReady` false still needs investigation.
- A webhook test reaches the intended test channel without exposing its URL in the result.
- A game chat test reaches the public channel, and an inbound test reaches the game only when that bridge is enabled.
- A command in the admin channel is accepted only when it is allow-listed and, if enabled, bound to an active administrator player. A public-channel or high-risk command is rejected.
- Slash commands return an interaction response, and the audit log contains both successful and rejected command attempts.
- A controlled event-automation failure produces one failure run and one alert without changing the rule's result.

## Common failure branches {#common-failures}

- **Slash command does not appear:** save the Bot settings, confirm the Bot reached `state=Connected` with `isReady=true`, verify the Guild ID and the `applications.commands` scope, then run **Sync slash commands** again. Verify that `/listplayers`, `/serverstatus`, or `/help` appears in the intended Guild rather than relying on a successful HTTP response alone.
- **Token test succeeds but Gateway fails:** a token test proves the saved credential can call the Bot test endpoint, not that the long-lived Gateway session can connect. Run diagnostics, check the REST and Gateway steps separately, inspect `state`, `isReady`, and `lastError`, then check proxy, DNS, firewall, and reconnect status. Verify by observing a later READY event and a stable Connected state.
- **Command is rejected:** confirm the message is in the admin channel, the prefix and command spelling match, the command is in the allow-list, and an active account binding is present when required. High-risk commands remain blocked even when listed. Verify the expected rejection in the audit log before changing the policy.
- **Webhook target is disabled:** enable the named target or select the default target in the bridge/alert setting. Confirm the target key matches an enabled row, save, and rerun the webhook test. Verify delivery in the test channel without exposing the URL.

## Limits and safety notes

::: warning
Discord delivery is an external dependency. A successful test webhook does not prove that the Gateway, channel filters, account binding, or long-lived reconnect path is healthy. Observe Bot status and diagnostics after changes.
:::

::: danger
Command relay can mutate the live server. Never allow a destructive command merely because it appears in a list. Keep a read-only allow-list, require account binding, separate public and admin channels, and review audit records after every change.
:::

- Gateway and proxy checks may be affected by DNS, firewall, quota, or runtime limitations. Escalate with the sanitized diagnostic summary rather than copying raw credentials or provider responses.

## Related pages

- [Game chat](../daily-operations/game-chat)
- [Console and logs](../daily-operations/console-and-logs)
- [Event automation](../automation-and-reliability/event-automation)
- [Access control](./access-control)
- [Application settings](./application-settings)
