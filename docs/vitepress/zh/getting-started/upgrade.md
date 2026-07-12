---
outline: deep
---

# 通过 Release ZIP 升级

> 面向拥有维护窗口和备份访问权限的管理员。需要当前 Release ZIP、与服务器兼容的目标 Release ZIP，以及可恢复的 ServerAdmin 配置和数据备份。

## 目的

替换发布包中的程序文件，同时保留线上服务器需要的管理员配置和数据库。

## 开始前

- 记录运行中的版本，并保留当前压缩包或已解压目录作为回滚候选。
- 备份 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/appsettings.json`、位于 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/` 的 ServerAdmin 数据库、相关游戏服务器配置和世界数据。
- 阅读目标 Release 的兼容性、先决条件、已知问题和手动配置变更。

## 操作步骤

1. 通知玩家、停止专用服务器，并确认能定位到可恢复的备份后再替换文件。
2. 将新压缩包解压到 `<7DTD_SERVER_ROOT>/Mods/`，替换程序集、依赖、`wwwroot/` 和 `Config/appsettings.Default.json`。
3. 保留 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/appsettings.json` 与位于 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/` 的 ServerAdmin 数据库。默认配置文件提供随包默认值，可写覆盖文件保存管理员修改。
4. 启动服务器，检查模组加载结果，登录后在仪表盘或玩家列表执行一次只读检查。
5. 若启动、认证或迁移失败，停止服务器，并恢复相互匹配的旧程序文件以及升级前的 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/Config/appsettings.json` 和 ServerAdmin 数据库备份。

## 验证结果

- 目标版本加载时没有新的依赖或迁移失败。
- 登录后，既有管理员配置及预期管理数据仍然保留。

## 限制与安全说明

::: danger
数据库迁移后，只恢复旧二进制文件不是安全回滚；必须同时恢复匹配的升级前数据库和配置备份。
:::

## 相关页面

- [安装](./installation)
- [初始管理员配置](./initial-administrator-configuration)
- [备份与恢复](../automation-and-reliability/backup-and-recovery)
- [故障排查](../reference/troubleshooting)
- [高级源码发布](./publishing)
