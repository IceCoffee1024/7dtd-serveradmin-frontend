---
outline: deep
---

# 高级：从源码构建与发布

> 面向修改后端 API 或构建自定义前端的维护者和部署工程师。通过 GitHub Release ZIP 安装的服主应使用[从 Release ZIP 安装](./installation)，无需执行本流程。

## 目的

让正在运行的后端 Swagger 成为唯一 API 契约，再生成并检查前端客户端，避免“前端已发布但请求仍按旧接口发送”。

## 开始前

- 开启维护窗口并通知玩家，确认发布配置指向目标服务器。
- 保留上一版后端发布物和匹配的前端构建作为回滚候选。
- 确认 `<SERVERADMIN_API_BASE_URL>` 已脱敏，浏览器不会从 `VITE_*` 变量获得凭据或令牌。

## 操作步骤

1. **发布后端。** 在后端工作区执行已审核的发布命令，例如 `dotnet publish src\LSTY.Sdtd.ServerAdmin\LSTY.Sdtd.ServerAdmin.csproj /p:PublishProfile=FolderProfile1`，并将输出部署到 `<7DTD_SERVER_ROOT>`。保留上一版作为回滚候选。
2. **重启服务器。** 通过已授权的维护流程重启 7DTD；重启会断开玩家。不要在进程恢复前发布前端。
3. **等待 Swagger 恢复。** 轮询 `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`，必须同时满足 HTTP 200 和非空 JSON。HTTP 200 空响应、HTML 登录页或旧缓存都不算通过。
4. **生成客户端。** 在前端工作区执行 `pnpm api:gen`，确认 `src/generated/api/` 的类型、SDK、校验和 Pinia Colada 文件更新。
5. **检查前端。** 按顺序执行 `pnpm typecheck` 和 `pnpm locale:check`。通过后再执行 `pnpm build`，把静态产物发布到前端托管位置。
6. **冒烟验证。** 清理代理/CDN 的旧静态缓存，重新登录，检查仪表盘、玩家列表、聊天、控制台、审计日志和 Swagger/API Documentation。

## 验证结果

- 每一步都有记录：后端发布成功、服务器重新在线、Swagger 非空 200、`api:gen` 完成、类型与语言检查通过。
- 浏览器 Network 中没有旧路径、重复 5xx 或一直 Pending 的请求；页面的成功/空状态与后端数据一致。
- 需要权限的操作仍遵守 Permission 和控制台命令策略，Audit Logs 能看到测试操作。

## 限制与安全说明

::: warning
不要跳过 Swagger 等待，也不要使用真实令牌、密码、私有 UNC 路径或本地机器名作为文档/脚本示例。
:::

::: danger
重启 7DTD 会断开玩家。发布静态文件不会自动回滚后端；出现不兼容时停止流量并恢复配套版本。
:::

- `pnpm api:gen` 可能在旧后端上成功但生成过时类型；先确认非空 Swagger，再信任生成结果。

## 相关页面

- [升级](./upgrade)
- [安装](./installation)
- [备份与恢复](../automation-and-reliability/backup-and-recovery)
- [故障排查](../reference/troubleshooting)
