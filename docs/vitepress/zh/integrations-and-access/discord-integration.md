---
outline: deep
---

# Discord 集成

> 面向可以更新 Discord 功能、发送测试消息、查看 Bot 诊断并读取审计记录的管理员和运维人员。除非显式启用，入站聊天和命令中继默认关闭。

## 目的 {#purpose}

在不把 Discord 凭据和高风险命令暴露给浏览器公共界面的前提下，连接通知、聊天桥接、受控命令中继、账号绑定和事件自动化失败告警。

## 开始前 {#before-you-begin}

- 在 Discord Developer Portal 创建应用和 Bot。只授予所需频道权限；使用前缀命令或入站聊天时启用 Message Content Intent。
- 将公共聊天与低风险通知放在公共频道，将命令结果放在管理员频道，可选地使用审计频道接收敏感告警。
- 准备测试频道和专用测试玩家。在工单中使用 `<DISCORD_GUILD_ID>`、`<DISCORD_PUBLIC_CHANNEL_ID>`、`<DISCORD_ADMIN_CHANNEL_ID>` 等占位符。
- 如果服务器不能直连 Discord，安排代理和防火墙负责人参与验证。

::: danger
Bot Token、Webhook URL、代理密码、绑定码和频道 ID 都属于秘密或敏感标识。只在受保护的设置表单中输入，绝不要放入截图、Markdown 代码块、浏览器环境变量、日志或 Git。
:::

## 操作步骤 {#procedure}

### 设置 {#settings}

1. 打开 **Discord 集成**，从 **概览** 开始。只有在测试 Webhook 目标和回滚方案准备好后才启用通知。
2. 在 **Webhook 与频道** 中填写默认 Webhook 或 `public`、`admin`、`audit` 等具名目标。频道负责人批准目标前，保持对应目标禁用。
3. 在 **聊天桥接** 中启用游戏到 Discord 的转发并选择目标键。只有公共频道和审核负责人准备好后才启用 Discord 到游戏；除非确有需要，保持私聊转发关闭。
4. 在 **Bot 与命令** 中启用 Bot 集成，填写 Guild ID，并分别填写公共频道和管理员频道 ID 后保存。Bot 在线后再启用 Slash Command 管理；启用命令中继时只配置尽可能小的只读白名单。
5. 在 **账号绑定** 中按需启用绑定作为第二层身份检查。为玩家 ID 和显示名称创建短时一次性绑定码，通过私密频道交给目标玩家或管理员。在 **兑换绑定码** 表单中填写 code、Discord 用户 ID 和用户名并提交；兑换成功后会创建绑定，过期或已兑换的 code 会被拒绝。审计备注只记录码前缀，原始码只显示一次。
6. 在 **告警与诊断** 中选择事件自动化失败告警的 Webhook 目标并配置简洁模板。中继测试只针对专用测试频道运行。
7. 每次测试前先保存设置。测试使用已保存设置，页面会在存在未保存更改时提示确认。

### 网络诊断 {#network-diagnostics}

1. 仅在部署确有需要时，在代理区域启用 HTTP/HTTPS 代理。文档中使用 `<DISCORD_PROXY_URL>` 作为占位符。
2. 运行诊断，检查代理 TCP、Discord REST API、Bot 实时连接和备用代理隧道结果。
3. 某些 7DTD 或 Unity 运行环境中，默认 WebSocket 检查可能失败而备用代理路径可用。只有当诊断结果与 Bot 运行时状态一致时，才认为集成可用。

### 命令和 Slash Command {#commands}

1. 保持命令白名单最小化。`listplayers` 可作为只读起点；内置的 `!serverstatus` 和 `!help` 由 Bot 处理，不需要加入控制台白名单。
2. 将 `!listplayers` 和其他中继命令视为真实控制台操作。启用前验证管理员频道过滤、前缀、白名单、账号绑定和审计行为。
3. 保存后运行 **测试 Bot**、刷新 Bot 状态并执行 **同步 Slash Command**。当前内置命令为 `/listplayers`、`/serverstatus` 和 `/help`。

## 验证结果 {#verify-result}

- 页面确认 Gateway 运行时 `state` 为 **Connected**，且诊断中的必需 Discord 检查通过。需要核对就绪状态或最近错误时，可在浏览器 Network 面板查看 `/api/DiscordIntegration/BotStatus` 返回的 JSON；`isReady` 是独立的就绪标记，不是页面上的第二个 state。不要把该响应中的敏感字段截图或提交。
- Webhook 测试消息到达预期测试频道，测试结果不会暴露 URL。
- 游戏聊天在启用时到达公共频道；仅当启用反向桥接时，入站测试才会进入游戏。
- 管理员频道命令只有在白名单中，并且在启用时绑定到有效管理员玩家才会接受；公共频道或高风险命令会被拒绝。
- Slash Command 返回交互响应，审计日志同时包含成功和拒绝的命令尝试。
- 受控的事件自动化失败产生一条失败运行记录和一条告警，不改变规则执行结果。

## 常见故障分支 {#common-failures}

- **Slash Command 不出现：** 保存 Bot 设置，确认页面显示 `state=Connected`，核对 Guild ID 和 `applications.commands` scope，再次执行 **同步 Slash Command**。需要确认就绪状态时，可选地在 `/api/DiscordIntegration/BotStatus` JSON 中查看 `isReady`。应在目标 Guild 中看到 `/listplayers`、`/serverstatus` 或 `/help`，不要只依据 HTTP 请求成功判断。
- **Token 测试成功但 Gateway 失败：** Token 测试只能证明已保存凭据可以调用 Bot 测试端点，不能证明长期 Gateway 会话能够连接。运行诊断，分别检查 REST 和 Gateway 步骤，查看页面 state，并可选地在 `/api/DiscordIntegration/BotStatus` JSON 中查看 `isReady`、`lastError`，再检查代理、DNS、防火墙和重连状态。应观察到后续 READY 事件和稳定的 Connected 状态，不要把该响应截图写入文档。
- **命令被拒绝：** 确认消息发在管理员频道，前缀和命令拼写正确，命令在白名单中，并且在需要时存在有效账号绑定。即使命令列入白名单，高风险命令仍会被阻止。先在审计日志中确认预期的拒绝，再修改策略。
- **Webhook 目标被禁用：** 启用具名目标，或在桥接/告警设置中选择默认目标。确认目标 key 与启用的行一致，保存后重新测试 Webhook；在测试频道验证投递，但不要暴露 URL。

## 限制与安全说明 {#limits-and-safety}

::: warning
Discord 投递依赖外部服务。Webhook 测试成功不代表 Gateway、频道过滤、账号绑定或长期重连链路都健康；修改后仍要观察 Bot 状态和诊断。
:::

::: danger
命令中继可能修改线上服务器。不要因为命令出现在列表中就放行破坏性命令；尽量保持只读白名单、启用账号绑定、分离公共和管理员频道，并在每次变更后复核审计记录。
:::

- DNS、防火墙、配额或运行时限制都可能影响 Gateway 和代理检查。升级处理时提供脱敏后的诊断摘要，不要复制原始凭据或服务商响应。

## 相关页面 {#related-pages}

- [游戏聊天](../daily-operations/game-chat)
- [控制台与日志](../daily-operations/console-and-logs)
- [事件自动化](../automation-and-reliability/event-automation)
- [访问控制](./access-control)
- [应用设置](./application-settings)
