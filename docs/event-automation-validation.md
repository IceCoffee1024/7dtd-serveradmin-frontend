# 事件自动化 MVP 真服验证清单

本文档用于在真实 7DTD 服务端上验证事件自动化 MVP 的安全边界和运行闭环。

## MVP 范围

当前规则创建、更新和试运行只允许以下触发器：

- `PlayerJoined`
- `PlayerLeft`
- `ChatMessage`
- `Cron`

死亡、击杀等底层游戏事件仍可被事件日志、经济、成就等模块使用，但不属于事件自动化 MVP 规则入口。

如果数据库中残留早期创建的死亡、击杀自动化规则，后端运行时会跳过这些规则。建议在验证前禁用或删除旧规则，避免管理页面继续显示超出 MVP 范围的配置。

## 准备工作

- 后端已发布并重启。
- 前端已执行 `pnpm api:gen` 并使用最新 API 类型。
- 事件自动化模块已启用。
- 如果要验证经济动作，经济模块已启用。
- 如果要验证 Discord 失败告警，Discord 集成已启用并配置可用的 Webhook 目标。

建议先清理历史测试污染：

- 删除或禁用名称包含 `[codex-validation]` 的测试规则。
- 使用运行日志清理功能清理测试运行历史。
- 确认统计看板只显示真实业务或本轮验证数据。

## 验证用规则

### 成功规则

创建一条聊天关键词规则：

- 触发器：`ChatMessage`
- 条件：`messageContains = ea-ok`
- 冷却：`cooldownSeconds = 30`，`cooldownScope = RulePlayer`
- 动作：发送私聊或全服消息

验证步骤：

- 玩家在游戏内发送包含 `ea-ok` 的消息。
- 规则成功执行。
- 执行历史出现成功记录。
- 今日触发数增加。
- 规则最后状态为 `Success`。

### 冷却规则

继续使用成功规则，在 30 秒内重复发送同样消息。

预期：

- 第二次不执行动作。
- 不刷屏。
- ModuleState 中出现 `Cooldown` 状态。
- 冷却结束后再次发送可以执行。

### 首次加入规则

创建新人欢迎规则：

- 触发器：`PlayerJoined`
- 条件：`firstJoinOnly = true`
- 动作：发送私聊、全服消息或新人奖励

验证步骤：

- 使用测试玩家首次进入服务器。
- 规则执行一次。
- 同一玩家再次进入服务器不重复触发。
- ModuleState 中出现 `FirstJoin` 状态。

### 失败规则

创建一条会失败但风险可控的规则，例如：

- 触发器：`ChatMessage`
- 条件：`messageContains = ea-fail`
- 动作：发送到一个未启用或不存在的 Discord Webhook 目标

预期：

- 执行历史出现失败记录。
- 今日失败数增加。
- 最近失败规则显示该规则。
- 失败详情能从统计卡片跳转到执行历史定位。
- 如果 Discord 失败告警已启用，告警消息发送到配置的目标频道。

## 审计边界

高风险动作必须验证审计：

- `KickPlayer`
- `MutePlayer`
- `ExecuteConsoleCommand`
- Discord 命令中继

验证要求：

- UI 层需要二次确认。
- 后端安全校验需要拒绝未授权高风险动作。
- 真实执行或拒绝都应写入审计日志。
- 控制台命令必须受允许列表约束。

## 后端 MVP 收敛验证

通过 API 或 Swagger 尝试创建以下触发器规则：

- `PlayerDied`
- `PlayerKilledPlayer`
- `PlayerKilledZombie`

预期：

- 创建、更新或试运行应返回校验错误。
- 前端规则弹窗不展示这些触发器。
- 游戏事件日志、经济死亡惩罚、击杀奖励等非事件自动化功能不受影响。

## 验收结果记录

建议每轮验证记录：

- 后端 commit。
- 前端 commit。
- 测试服务器名称。
- 测试玩家 ID。
- 验证时间。
- 成功规则 RunLog ID。
- 失败规则 RunLog ID。
- 是否出现重复触发或刷屏。
- 是否出现审计缺失。

## 回归命令建议

真服验证前后建议至少运行：

```bash
pnpm smoke:live
pnpm test:unit
pnpm locale:check
pnpm typecheck
```

如果本轮涉及页面布局或规则 Builder，额外运行：

```bash
pnpm visual:critical
```

后端建议运行：

```bash
dotnet test tests/LSTY.Sdtd.ServerAdmin.Tests/LSTY.Sdtd.ServerAdmin.Tests.csproj -v:minimal
```

## 失败排查优先级

优先排查顺序：

1. 规则是否启用，触发器是否属于 MVP 范围。
2. 条件 JSON 是否与事件上下文实际字段匹配。
3. 冷却或首次加入状态是否已存在。
4. 动作依赖的模块是否启用且配置有效。
5. RunLog 的错误摘要和异常详情。
6. 审计日志中是否记录了高风险动作的允许或拒绝。
7. 如果涉及 Discord，确认 Webhook 目标或 Bot 状态可用。
