---
outline: deep
---

# 从 Release ZIP 安装

> 面向七日杀专用服务器服主或管理员。需要与服务器兼容的 Release 发布包、`<7DTD_SERVER_ROOT>/Mods/` 的文件访问权限，以及已批准的初始管理账号。

## 目的

将打包好的 ServerAdmin 后端和 Web 管理台作为一个模组安装；不需要前端仓库或源码构建。

## 开始前

- 阅读所选 Release 的兼容性、先决条件、已知问题、推荐资源名称，以及发布时提供的 SHA-256 校验值。
- `0_TFP_Harmony` 是可选依赖。没有它 ServerAdmin 仍可启动，但基于 Harmony 的功能可能不可用。仅当 Release 兼容性说明表明所需功能依赖它时，才安装或确认它。
- 替换前备份已有的 `Mods/ServerAdmin/` 目录。
- 确定浏览器在服务器主机还是获准的远程网络中运行；不要在公网端口暴露初始凭据。

## 操作步骤

1. 若专用服务器正在运行，先停止服务器，并下载 Release 指定的 `ServerAdmin.v<version>.zip`。
2. 有校验值时验证 SHA-256，然后解压到 `<7DTD_SERVER_ROOT>/Mods/`。
3. 确认 `ModInfo.xml` 直接位于 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/`；若形成 `Mods/ServerAdmin/ServerAdmin/`，移动内层目录的内容。
4. 正常启动专用服务器并等待 ServerAdmin 模组加载。打开已配置的管理地址；`http://localhost:<PORT>/` 只适用于在服务器主机上打开浏览器。获准的远程浏览器使用 `http://<SERVER_HOST>:<PORT>/`，其中 `<SERVER_HOST>` 为实际服务器主机名或获准的私有 IP，且须遵守防火墙和网络策略。
5. 使用 Release 提供的初始账号登录，立即修改凭据，并用服务器网络策略限制远程访问。

## 验证结果

- 服务器日志显示模组已加载，且没有兼容性或依赖失败。
- 已配置的管理地址可打开登录页；登录后显示仪表盘或简单只读页面。

## 限制与安全说明

::: warning
Release 说明定义游戏版本和先决条件。不要为了诊断模组加载而安装前端构建工具或前端源码。
:::

::: danger
不要在公网管理端口暴露已知初始凭据；在远程访问前修改凭据，并通过防火墙或现有反向代理限制访问。
:::

## 相关页面

- [升级](./upgrade)
- [初始管理员配置](./initial-administrator-configuration)
- [高级源码发布](./publishing)
- [备份与恢复](../automation-and-reliability/backup-and-recovery)
- [故障排查](../reference/troubleshooting)
