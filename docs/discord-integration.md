# Discord 集成配置与验证

本文档用于记录 7DTD Server Admin 的 Discord 集成配置、验证清单和运行安全边界。

## 功能范围

- 通过 Discord Webhook 发送通知。
- 按目标分流通知，例如 public、admin、audit。
- 将游戏内聊天转发到 Discord。
- 将 Discord 公共频道聊天桥接回游戏。
- 在 Discord 管理频道执行白名单内的控制台命令。
- 注册服务器级 Slash Command：`/listplayers`、`/serverstatus`、`/help`。
- 在需要更严格身份校验时，要求 Discord 账号先绑定到有效管理员玩家。
- 将事件自动化失败告警发送到 Discord。

## Discord 应用配置

在 Discord Developer Portal 创建或打开一个 Application。

Bot 必要配置：

- 创建 Bot，并复制 Bot Token。
- 如果使用前缀命令或 Discord 到游戏聊天桥接，启用 Message Content Intent。
- 邀请 Bot 时勾选 `bot` 和 `applications.commands` scopes。
- 给 Bot 授权读取消息、发送消息、使用 Slash Command 的频道权限。

推荐频道划分：

- 公共频道：聊天桥接、低风险公共消息。
- 管理频道：命令执行、运维结果回写。
- 可选审计频道：敏感通知、事件自动化失败告警。

## Server Admin 设置

打开 Discord 集成设置页。

Bot 最小配置：

- 启用 Discord 集成。
- 启用 Bot 集成。
- 填写 Bot Token。
- 填写 Guild ID。
- 如果启用 Discord 到游戏聊天桥接，填写 Public Channel ID。
- 如果启用 Discord 命令执行，填写 Admin Channel ID。
- 保存设置。
- 执行 Bot 测试。
- 刷新 Bot 状态。
- 同步 Slash Command。

Webhook 最小配置：

- 填写默认 Webhook URL，或添加具名 Webhook 目标。
- 执行 Webhook 测试。

代理配置：

- 使用 HTTP/HTTPS 代理地址，例如 `http://127.0.0.1:7890`。
- v2rayN 新版本 mixed 端口可以按本地 HTTP 代理地址填写。
- 诊断面板会显示 Discord API 和 Bot 实时连接是否可用。

## 网络诊断

诊断面板面向运维结果展示，不要求普通用户理解底层实现细节。

使用代理时，健康状态通常应满足：

- 代理连接通过。
- Discord API 连接通过。
- Bot 实时连接可用。

在部分 7DTD/Unity/Mono 运行环境中，默认 WebSocket 检查可能失败，但代理隧道路径成功。只要诊断显示 Bot 实时连接可用，Bot 功能仍可正常使用。底层连接方式只应放在高级诊断中用于排障。

## 命令安全边界

Discord 前缀命令执行必须保持严格限制。

规则：

- 命令必须使用配置的前缀，通常是 `!`。
- 命令必须存在于 Discord 命令白名单。
- 高风险命令前缀即使被误加入白名单，也会继续被阻止。
- 命令执行结果会回写到 Discord。
- 命令尝试会写入审计日志。
- 启用账号绑定后，Discord 用户必须绑定到有效管理员玩家。

推荐白名单：

```text
listplayers
```

除非明确接受风险并确认审计链路有效，否则不要放行会修改服务器状态的命令。

Bot 内置命令：

- `!serverstatus` 由 Bot 内部处理，不需要加入控制台命令白名单。
- `!help` 由 Bot 内部处理，不需要加入控制台命令白名单。
- `/serverstatus`、`/listplayers`、`/help` 在同步 Slash Command 后可用。

## 验证清单

保存设置并同步 Slash Command 后，建议按以下顺序验证：

- Bot 状态为 Connected。
- 网络诊断显示 Discord 检查可用。
- Webhook 测试成功。
- 如果启用游戏到 Discord 桥接，游戏内聊天能出现在目标 Discord 频道。
- 如果启用 Discord 到游戏桥接，Discord 公共频道消息能出现在游戏内。
- 在管理频道发送 `!listplayers`，且该命令在白名单中时可以执行。
- 在管理频道发送 `!serverstatus` 可以返回服务器状态。
- 从 Discord Slash Command 菜单选择 `/serverstatus` 并确认有响应。
- 非白名单命令会被拒绝。
- 高风险命令会被拒绝。
- 启用账号绑定后，未绑定或禁用的 Discord 账号会被拒绝。
- 审计日志中能看到成功和拒绝的 Discord 命令记录。

频道级验证必须通过真实 Discord 消息完成，因为频道过滤发生在 Gateway 事件处理链路中。

## 真服闭环验证记录

建议每轮 Discord 真服验证都记录以下信息，避免只凭“测试按钮成功”判断功能可用：

- 后端 commit。
- 前端 commit。
- Discord Guild ID 后 4 位。
- Public Channel ID 后 4 位。
- Admin Channel ID 后 4 位。
- Bot 状态截图或状态文本。
- 网络诊断结果。
- Webhook 测试结果。
- `/serverstatus` 响应时间和返回摘要。
- `!serverstatus` 响应时间和返回摘要。
- `!listplayers` 成功或拒绝结果。
- 一条游戏聊天到 Discord 的消息时间。
- 一条 Discord 公共频道到游戏聊天的消息时间。
- 一次账号绑定成功或拒绝记录。
- 对应审计日志 ID 或时间范围。

最小验收标准：

- Bot 状态为 Connected 或 Ready。
- Slash Command 能返回到发起命令的 Discord 交互。
- 前缀命令结果能回写到管理频道。
- 公共频道消息不会触发管理命令。
- 非白名单命令和危险命令都会被拒绝。
- 启用账号绑定时，未绑定用户无法执行管理命令。
- 代理启用时，诊断结果与 Bot 实际状态一致。

## 长稳验证

Bot Gateway、代理和 Slash Command 属于长连接链路，功能测试通过后还需要做一轮短时稳定性观察。

建议观察项：

- Bot 状态保持 Connected。
- Gateway 断线后能进入 Reconnecting 并自动恢复。
- 修改 Bot Token、Guild ID、频道 ID 或代理后，保存设置会触发运行时重载。
- 代理诊断结果与 Bot 实际状态一致。
- `/serverstatus` 和 `/listplayers` 的结果能回写到 Discord。
- 前缀命令 `!serverstatus`、`!help` 不依赖控制台命令白名单。
- 前缀命令 `!listplayers` 必须在 Discord 命令白名单中才允许执行。
- 长输出会被截断并提示省略行数，不会超过 Discord 消息长度限制。
- 所有命令成功、拒绝和异常都能写入审计日志。

建议最低观察时间：

- 本地联调：10 到 15 分钟。
- 真服灰度：至少 1 小时。
- 生产启用命令执行：建议观察一个完整管理值守周期。

## 账号绑定路径验证

启用账号绑定后，至少验证三条路径：

- 未绑定 Discord 账号执行命令：应被拒绝。
- 已绑定且有效的 Discord 账号执行白名单命令：应允许执行。
- 已绑定但被禁用的 Discord 账号执行命令：应被拒绝。

绑定码验证：

- 创建绑定码后，页面只展示一次原始 code。
- 数据库只保存 code 前缀和 hash，不保存原始 code。
- 过期绑定码无法兑换。
- 已兑换绑定码不能重复兑换。
- 清理过期绑定码不会影响已绑定账号。

## 事件自动化失败告警验证

启用事件自动化失败告警后，创建一条低风险失败规则验证告警链路：

- 触发器使用 `ChatMessage`。
- 条件使用测试关键词，例如 `discord-fail-alert`。
- 动作发送到一个未启用的 Webhook 目标，或使用其他可控失败动作。

预期结果：

- 规则执行历史产生失败记录。
- 事件自动化统计看板今日失败数增加。
- 最近失败规则能定位到该规则。
- Discord 告警目标收到失败告警。
- 告警内容包含规则名、触发器、错误摘要和发生时间。

## 常见问题

Slash Command 不出现：

- 确认邀请 Bot 时包含 `applications.commands`。
- 再次点击同步 Slash Command。
- 切换 Discord 频道，或重启 Discord 客户端清理客户端缓存。
- 确认 Guild ID 正确。

Bot Token 测试成功，但 Gateway 无法连接：

- 运行网络诊断。
- 如果 Discord API 通过且 Bot 实时连接可用，集成功能可用。
- 如果实时连接检查全部失败，检查代理、防火墙、DNS、出站 TLS 访问。

命令被拒绝：

- 确认消息发送在管理频道。
- 确认命令前缀正确。
- 确认命令已加入白名单。
- 如果启用账号绑定，确认 Discord 用户已绑定到有效管理员玩家。

Webhook target disabled：

- 启用对应具名目标，或改用默认 Webhook 目标。
- 确认目标 key 与配置中的目标一致。

## 运维建议

- 不要把 Bot Token、Webhook URL、生产账号密码写入前端 `.env` 或提交到 Git。
- Discord 命令白名单保持最小化。
- Discord 命令执行优先只放行只读命令。
- 开启命令执行后定期查看审计日志。
- 修改代理或 Bot 设置后重新运行诊断。
