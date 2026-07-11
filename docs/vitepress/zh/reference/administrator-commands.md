---
outline: deep
---

# 管理员相关命令

> 面向拥有控制台命令权限的服主或管理员。本页只覆盖 ServerAdmin 提供、且用于管理、诊断、维护或恢复的命令，不是完整的玩家命令指南。

## 范围与安全 {#scope}

下表中的别名来自当前模组。拥有相应权限时，可以在游戏控制台输入命令，也可以通过[控制台](../daily-operations/console-and-logs#console)工作流发送命令。尽量使用稳定的玩家标识，并在审计记录中保留原因、目标和结果。

::: warning
命令输出只能说明请求已被处理，不能证明远程客户端或游戏进程已经完成副作用。任何改变状态的命令都要重新检查玩家、世界、历史记录或服务器日志。
:::

## 开始前 {#before}

1. 确认后端可访问，并且当前账号能进入控制台工作流。
2. 使用 `<PLAYER_ID>`、`<PLAYER_NAME>`、`<ENTITY_ID>` 或坐标确认目标。不要把真实标识粘贴到共享工单或文档示例中。
3. 对于破坏性操作，先公告维护窗口，必要时完成备份，并在执行前记录原因。
4. 如果目标或语法不确定，先执行只读诊断命令。

## 命令参考 {#commands}

`State` 列说明命令预期产生的影响。`Audit` 列说明应检查的证据；部分早于审计辅助器的命令可能只有控制台或游戏日志证据。

| 命令与语法 | 范围和必填输入 | 预期输出 | 审计与状态 |
| --- | --- | --- | --- |
| `ty-cbt [<X> <Y> <Z>]` 或 `ty-CheckBlockType` | 读取发送者脚下或指定坐标的方块。 | 方块位置、类型和名称。 | 控制台证据；只读。 |
| `ty-gm <Message> <SenderName>` | 向所有已连接客户端广播消息。 | 发送结果或无效输入错误。 | 审计 `GlobalMessage`；改变玩家可见聊天。 |
| `ty-pm <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <Message> <SenderName>` | 向一名在线玩家发送私信。 | 目标解析和发送结果。 | 审计 `PlayerMessage`；改变玩家可见聊天。 |
| `ty-gi <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <ItemName> [Count] [Quality] [Durability] [ModsCsv]` | 发放物品；使用 `all` 可指定所有玩家。 | 发放结果；背包已满时物品可能掉到地面。 | 可用时写入审计；改变背包或地面物品。 |
| `ty-rpi <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <ItemName> [Toolbelt\|Backpack] [SlotIndex]` | 移除玩家匹配的物品或指定槽位物品。 | 移除数量或目标/语法错误。 | 审计 `RemovePlayerItems`；破坏性背包修改。 |
| `ty-rplc <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME>` 或 `ty-rplc <X> <Y> <Z>` | 移除玩家的领地保护，或移除坐标处的保护。 | 移除结果或找不到目标错误。 | 可用时写入审计；改变领地保护所有权。 |
| `ty-rpp <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME>` | 重置原生 7DTD 玩家档案。 | 重置操作的确认/结果。 | 审计 `ResetPlayer`；没有原生存档备份时无法撤销。 |
| `ty-rs [<delay>] [-f\|force]` | 请求重启，可延迟或强制执行。 | 请求、倒计时或重复请求状态。 | 审计 `Restart`；会断开玩家并改变线上状态。 |
| `ty-setcvar <cvarName> <cvarValue>` 或 `ty-setcvar <PLAYER_ID\|ENTITY_ID\|PLAYER_NAME> <cvarName> <cvarValue>` | 为发送者或在线玩家设置自定义变量。 | 变量赋值或玩家不存在错误。 | 审计 `PlayerCustomVar`；改变在线玩家状态。 |
| `ty-re <ENTITY_ID>` 或 `ty-RemoveEntity <ENTITY_ID>` | 按实体 ID 移除一个游戏实体。 | 移除结果或错误。 | 可用时写入审计；破坏性世界修改。 |
| `ty-pb <blockIdOrName> <X> <Y> <Z>` | 在坐标处放置一个方块。 | 放置结果或方块查找错误。 | 可用时写入审计；改变世界方块。 |
| `ty-fb <blockIdOrName> <X1> <Y1> <Z1> <X2> <Y2> <Z2>` | 用方块填充区域；也支持保存位置的交互流程。 | 区域或参数校验结果。 | 可用时写入审计；批量改变世界。 |
| `ty-pp <prefabFileName> <X> <Y> <Z> [noSleepers] [addToRWG]` | 在指定位置放置预制体；游戏内流程可省略位置和标志。 | 放置结果和位置。 | 可用时写入审计；批量改变世界。 |
| `ty-da <X1> <Y1> <Z1> <X2> <Y2> <Z2> <X> <Y> <Z> [rot]` | 复制区域；`p1` 和 `p2` 可在交互流程中保存位置。 | 源位置、目标位置和旋转结果。 | 审计 `WorldBlockArea`；批量改变世界。 |
| `ty-ep <X1> <Y1> <Z1> <X2> <Y2> <Z2> <prefabFileName> [overwrite]` | 将区域导出到 `LocalPrefabs`，文件名由管理员指定。 | 导出路径/名称或文件已存在错误。 | 控制台证据；写入服务器预制体文件。 |
| `ty-up [<id>]` | 撤销最近的预制体、填充、方块或复制操作。 | 恢复位置或没有可撤销记录错误。 | 审计 `WorldPrefabUndo`；改变世界并消耗撤销记录。 |
| `ty-sus [<size>]` | 读取或设置内存撤销历史大小；`0` 或更小会清空历史。 | 当前大小或已清空结果。 | 控制台证据；设置为 `0` 会移除本次会话的恢复选项。 |
| `ty-ReloadAllXmls` | 同步重载支持的游戏 XML 文件。 | 重载完成或控制台错误。 | 控制台/游戏日志证据；改变运行时定义。 |
| `ty-gc` | 执行框架垃圾回收辅助操作。 | 完成或控制台错误。 | 控制台证据；不预期产生持久游戏修改。 |

## 验证结果 {#verify}

1. 读取返回输出，并记录命令、目标、原因和时间。
2. 打开[审计日志](../daily-operations/console-and-logs#audit-logs)，确认动作、目标、操作者和来源。没有审计行的命令，改查控制台或游戏日志。
3. 重新读取受影响的工作流：玩家档案、背包、领地、世界坐标、重启历史或服务器进程都应显示预期状态。
4. 如果输出与状态不一致，停止重复执行，改按[故障排查](./troubleshooting)流程处理。

## 限制与安全说明 {#limits}

::: danger
`ty-rpp`、`ty-rpi`、`ty-rplc`、`ty-re`、世界编辑命令、强制重启和 `overwrite` 可能销毁或替换数据。在线服务器执行前应完成可验证的备份，并由第二名人员确认目标。
:::

::: tip
`ty-gi` 是管理员发放，不是玩家获得来源。启用物品获得追踪后，调查时应将管理员发放与丧尸包等掉落容器或地面拾取来源区分开。
:::

原版七日杀命令和其他模组提供的命令不在本页范围内。请使用游戏控制台的 `help <command>` 输出和对应模组文档；模块关闭后不要假定本页命令仍然存在。

## 相关页面

- [控制台菜单索引](./console-menu-index)
- [控制台与日志](../daily-operations/console-and-logs)
- [访问控制](../integrations-and-access/access-control)
- [备份与恢复](../automation-and-reliability/backup-and-recovery)
- [故障排查](./troubleshooting)
