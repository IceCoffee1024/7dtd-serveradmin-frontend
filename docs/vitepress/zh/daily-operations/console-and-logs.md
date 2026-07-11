# 控制台与日志

## 适用范围、角色与前置条件

本页面向有控制台、审计和游戏事件读取权限的管理员。控制台只展示后端允许的命令；命令权限、模块状态和游戏进程可用性必须先确认。

## 目的

在受控权限下执行或验证必要的服务器命令，并用审计日志和游戏事件日志建立可追溯的事实链。

## Console（控制台）

1. 等待允许命令列表加载，在输入框使用自动完成查看命令说明和帮助；无效命令不会发送。
2. 输入经确认的管理员命令并提交。前端按 `inMainThread: true` 请求后端，因此命令链仍可能同步占用游戏主线程；仅在确实需要主线程语义时运行。
3. 读取带有 Error、Exception、Warning、Assert 或 Log 类型的输出，记录命令、时间和结果。命令历史可用方向键回填，但回填前仍要复核参数和目标。

管理员需要指导或验证玩家时，才在此使用最小化的玩家命令。例如可用无副作用查询确认状态；不要在手册中复制真实玩家 ID、IP、密码或令牌。重启、踢出、封禁、发物品、传送、`saveworld` 和设置命令属于改变状态的操作，应从对应管理页面或受控流程执行。

## Audit logs（审计日志）

按关键词、时间范围、Source（Api、ChatCommand、ConsoleCommand、System）、Operator、Action Type（Create、Update、Delete、Enable、Disable、Execute、Send、Kick、Ban、Restart 等）、资源类型/ID和 Succeeded 筛选。重点查看 `errorMessage`、operator、summary 和 createdAt；失败记录是需要调查的事实，不要用“请求已发送”替代成功。

## Game event logs（游戏事件日志）

按关键词、玩家/目标玩家、事件类型和时间范围筛选 PlayerLogin、PlayerJoined、PlayerLeft、PlayerDied、PlayerKilledZombie、PlayerKilledPlayer。点击玩家 ID 进入画像，结合 Chat History 和 Audit Logs 判断是玩家行为、游戏事件还是管理员动作。

## 可观察的验证

- Console 的允许命令、帮助文本和执行输出加载成功；一次读取命令的结果在输出中出现且没有异常。
- Audit Logs 能按 Source/Action/Succeeded 找到测试动作，并显示 operator、资源和错误信息。
- Game Event Logs 的玩家事件与时间线/聊天一致；同一时间段的管理员动作只出现在 Audit，而不会被误标为玩家活动。

## 限制与安全

- **命令权威**：允许列表和 Permission 决定可见/可执行范围；不要通过前端输入绕过后端策略。
- **主线程**：`inMainThread: true` 不等于异步；重命名、存档、地图渲染或高成本查询可能阻塞游戏线程。
- **副作用**：控制台可改变世界、玩家、配置和进程。先做备份、确认目标、维护窗口和回滚方案；危险命令只在明确授权后执行。
- 日志受模块启用、保留策略和数据库可用性影响；日志缺失时先查后端错误和时间范围。

## 相关页面

- [玩家列表与玩家画像](./players)
- [游戏聊天](./game-chat)
- [访问控制](../integrations-and-access/access-control)
- [备份与恢复](../automation-and-reliability/backup-and-recovery)
- [故障排查](../reference/troubleshooting)
