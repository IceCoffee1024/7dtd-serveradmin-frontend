# 玩家列表与隐藏的玩家画像

## 适用范围、角色与前置条件

本页面向有玩家查询或管理权限的管理员。Player List 需要后端在线；Kick、Ban、Mute、发放物品、重置资料和传送等操作还需要对应权限，并可能触发审计。Player Profile 不是左侧菜单项，而是从玩家列表、聊天、游戏事件或其他玩家链接进入的隐藏详情路由。

## 目的

用稳定身份选择正确玩家，区分在线状态与历史记录，再在详情页按活动、资产/库存、追踪和治理信息调查。页面不是玩家自助指南。

## Player List 工作流

1. 打开 **Online Players** 查看当前实体、等级、游戏阶段、击杀/死亡、IP、Ping、位置、技能点、平台 ID、稳定 Player ID 和权限等级。用玩家名搜索时，最终以稳定 Player ID 或平台 ID确认身份；Entity ID 可能随重连改变。
2. 打开 **History Players** 查看不在线玩家和最后活动；将时间、名字和 ID 与聊天/事件记录交叉验证。
3. 需要管理土地容器时使用 **Land Claim Containers** 标签。列表只显示后端当前可读或已加载区域内、与玩家领地关联的容器；加载失败或空库存不是“没有容器”的证明。
4. 点击玩家名或 **Player Profile** 进入隐藏画像，确认顶部身份、在线状态和加载时间后再执行操作。

## Player Profile 详情

- **Overview**：基础资料、进度、访问/处罚状态、资产摘要和最近游戏事件/聊天。
- **Activity**：按时间查看 Login、Joined、Left、Chat、Death、Kill、Location、Inventory、Session 等活动，适合回答“发生了什么、何时发生”。
- **Assets / inventory**：查看库存、车辆、领地容器和资产；从 Online Players 打开的 Inventory 对话框是即时查看，画像中的 Inventory Snapshots/Inventory Diff 是追踪记录，不能混为当前背包。
- **Tracking**：查看会话、位置样本、轨迹、库存快照和区域查询；需要启用 Player Tracking，并可能需要时间范围、最小距离或 GPS 地图。
- **Governance / Audit**：查看处罚历史、管理员操作和失败计数。**Audit** 记录管理员或系统对资源的动作；**Activity** 记录玩家/游戏事件，两者用途不同。

## 可观察的验证

- 选中的 Player ID、平台 ID、显示名和 Entity ID 在详情页一致；重连后用稳定 ID仍能找到同一玩家。
- 详情页的活动时间线与 Chat History/Game Event Logs 的记录能相互对应；审计条目的 operator、action、result 可追溯到一次管理操作。
- Tracking 页面有明确数据时间范围；从轨迹或区域结果跳到 GPS 后，地图中心和玩家身份保持一致。

## 限制与安全

- IP、库存、位置和处罚信息属于敏感运维数据；截图、导出和共享前必须脱敏。
- Kick/Ban/Mute、发物品、传送、移除领地或重置原生资料可能不可逆或影响玩家。重置会先处理在线玩家并保留原生存档备份，但插件数据不会因此自动清除；执行前读确认文本并留审计。
- 活动、追踪和库存快照依赖模块启用、后端采集时机和当前可读区域；缺失数据不应被解释为玩家从未行动。

## 相关页面

- [GPS 地图](./gps-map)
- [游戏聊天](./game-chat)
- [控制台与日志](./console-and-logs)
- [玩家追踪](../game-and-player-management/player-tracking)
- [访问控制](../integrations-and-access/access-control)
