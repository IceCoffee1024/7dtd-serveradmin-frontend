---
outline: deep
---

# 事件自动化

> 面向有规则配置、试运行、运行历史和审计读取权限的管理员。需要后端事件自动化模块、相关依赖模块和游戏事件回调已启用；MVP 规则入口只接受 `PlayerJoined`、`PlayerLeft`、`ChatMessage`、`Cron`。

## 目的

在受控触发器和动作边界内自动发送消息、执行奖励或运行受限命令，并用冷却、首次加入状态、运行日志和审计记录避免重复或无记录的操作。

## 开始前

- 先阅读仓库 `docs/event-automation-validation.md` 的真服验证清单，准备专用测试规则和可回收的测试数据。
- 确认事件自动化模块已启用；使用经济动作时同时启用经济模块，使用 Discord 动作或失败告警时配置 Discord 集成和命名 Webhook 目标。
- 确认账号能验证规则、执行试运行、读取运行历史和审计日志。不要在规则消息、玩家条件或测试数据中填写真实令牌、Webhook URL 或不必要的玩家标识。

```json
{
  "triggerType": "ChatMessage",
  "conditions": {
    "messageContains": "ea-ok",
    "cooldownSeconds": 30,
    "cooldownScope": "RulePlayer"
  },
  "actions": [
    {
      "type": "SendPrivateMessage",
      "target": "TriggerPlayer",
      "message": "Welcome, {playerName}!"
    }
  ]
}
```

## 操作步骤

### 规则 {#rules}

1. 打开规则页，确认触发器下拉框只显示 `PlayerJoined`、`PlayerLeft`、`ChatMessage`、`Cron`。先用模板或可读的 Builder 创建规则，再检查生成的条件和动作 JSON。
2. 为 `ChatMessage` 选择 `chatType`、`messageContains`、`messageStartsWith` 或 `messageEquals`，按需启用 `ignoreCase`；为玩家事件设置玩家 ID/名称条件；为 `Cron` 同时填写 `cronExpression` 和 `timeZoneId`，并决定是否允许并发执行。
3. 为可能重复到达的规则设置 `cooldownSeconds`（1 到 86400）和 `cooldownScope`（`RulePlayer` 或 `Rule`）。前者按规则和玩家隔离，后者按整条规则隔离；先用短冷却在测试环境验证，再扩大范围。
4. 仅在 `PlayerJoined` 上启用 `firstJoinOnly`。让测试玩家首次加入后检查动作只执行一次，再次加入应被首次加入状态拦截；不要用删除规则来代替清理状态的验证。
5. 保存前点击验证和试运行，读取“是否匹配”和动作摘要。启用包含 `KickPlayer`、`MutePlayer` 或 `ExecuteConsoleCommand` 的规则时，确认对话框、动作显式允许字段和后端校验必须全部通过；控制台动作还必须提供非空 `allowedCommands` 前缀列表，危险前缀需要 `allowUnsafe=true`。
6. 保存规则并观察规则表的启用状态、最近匹配时间和最近状态。创建受控失败规则时，可让 `ChatMessage` 匹配 `ea-fail` 并发送到未启用或不存在的 Discord 目标，不要使用真实频道或凭据。

### 执行历史 {#run-history}

1. 在运行历史按规则 ID、触发器、成功状态和时间范围筛选；从规则统计中的最近失败入口进入时，应保留规则和失败筛选。
2. 打开已持久化的运行详情，核对规则名、触发器、玩家（如有）、开始/结束时间、耗时、状态、摘要、错误信息和 `detailsJson`。把条件匹配、冷却/首次加入状态和动作错误分开判断；冷却或首次加入拦截可能在写入运行历史记录前返回。
3. 受控失败应出现失败记录、今日失败数增加和最近失败规则；如果启用了 Discord 失败告警，告警应发送到配置的目标。告警失败不会把原规则运行改成成功。
4. 测试结束后先用预览清理测试运行，再确认数量后执行删除；按保留天数清理过期运行时也要保留正式业务证据。

### 设置 {#settings}

1. 在设置中启用或停用事件自动化，并设置 `HistoryRetentionDays`。停用模块会停止规则运行，但不会替你删除规则配置。
2. 保存后重新加载设置，确认历史保留天数和启用状态。规则依赖的经济、Discord 等模块需在各自设置页单独验证。
3. 在 Discord 集成设置中启用事件自动化失败告警，选择安全的目标键并填写不含秘密的消息模板；同时确认允许事件自动化发送 Discord 消息和目标 Webhook 可用。

## 验证结果

- 规则编辑器和 API 验证只接受四个 MVP 触发器；试运行返回匹配结果和动作摘要，保存后规则表状态与设置一致。
- 冷却窗口内的第二次触发会抑制动作；请检查事件自动化模块状态和剩余冷却时间，或在窗口结束后用后续触发验证。首次加入测试对同一玩家只执行一次。被冷却或首次加入状态拦截的触发可能在写入运行历史记录/状态前返回。
- 受控失败在运行历史中有失败状态、错误摘要和可展开详情；规则统计的今日失败数、最近失败入口和 Discord 告警（若启用）彼此一致。
- 高风险动作的允许字段、二次确认、后端安全校验和审计日志都可找到；被拒绝的动作同样要有审计事实。

## 限制与安全说明

::: warning
事件回调可能高频到达，冷却是防刷屏和重复奖励的必要条件，不是权限替代。条件 JSON 的未知键会被警告并忽略；动作依赖的模块关闭或配置无效时，运行会失败并写入历史。
:::

::: danger
启用踢出、禁言或控制台动作前必须完成二次确认、最小允许列表和审计验证。`ExecuteConsoleCommand` 只能使用允许前缀，危险命令需要显式安全确认；Webhook URL、Bot token、玩家 ID 和内部路径只能放在受保护的配置中。
:::

- MVP 触发器范围固定为 `PlayerJoined`、`PlayerLeft`、`ChatMessage`、`Cron`。不要把未列出的触发器写入新规则或验证脚本。

## 相关页面

- [Discord 集成](../integrations-and-access/discord-integration)
- [控制台与日志](../daily-operations/console-and-logs)
- [计划任务](./scheduler)
- [访问控制](../integrations-and-access/access-control)
- [故障排查](../reference/troubleshooting)
