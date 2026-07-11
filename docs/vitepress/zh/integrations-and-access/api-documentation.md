---
outline: deep
---

# API 文档

> 面向需要查看运行中后端契约或重新生成前端客户端的开发和运维人员。能否访问取决于后端认证和 Swagger 暴露策略。

## 目的 {#purpose}

把运行中后端的 Swagger/OpenAPI 文档作为路由、请求体、响应模型和前端生成代码的事实来源。

## 开始前 {#before-you-begin}

- 确认目标 `<SERVERADMIN_API_BASE_URL>`，并确认后端在发布或重启后已经完成启动。
- 为受保护接口准备授权账号。公开示例不得出现访问 Token、密码、Cookie 或私有主机名。
- Swagger UI 或原始文档是否公开、是否需要认证取决于部署策略。公开文档不等于安全；受保护文档返回 `401` 或 `403` 是认证边界，不代表 Schema 损坏。
- 使用测试服务器和 `<PLAYER_ID>`、`<EXAMPLE_WEBHOOK_URL>` 等脱敏值尝试请求。
- 在重新生成代码前确认前后端工作区处于预期的相同版本。

## 操作步骤 {#procedure}

1. 从控制台菜单打开 **API 文档**。本地化路由为 `swagger` 入口，具体会按部署配置跳转到后端 Swagger UI 或文档。
2. 检查 `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`。只有 HTTP 200 且返回非空 JSON OpenAPI 文档时才能继续。HTML 登录页、空响应或旧缓存都不是有效契约。
3. 在 Swagger UI 中选择操作，阅读认证要求、HTTP 方法、路径、查询或请求体字段、成功响应和错误响应。只在私有测试浏览器中使用 **Authorize** 控件。
4. 先使用脱敏值尝试只读操作，确认状态码和响应形状后再测试变更操作。探索时不要发送真实 Webhook、命令、封禁、重启或恢复请求。
5. 后端 API 变更后，在前端工作区针对已验证的 Swagger 文档执行 `pnpm api:gen`。检查生成的类型、SDK、校验和 Pinia Colada 文件，不要手工编辑生成目录。
6. 执行 `pnpm typecheck` 和 `pnpm locale:check`，再冒烟检查受影响页面。记录文档地址、生成时间和前端提交，不要记录凭据。

## 验证结果 {#verify-result}

- Swagger 文档非空，并列出页面所需端点。
- 生成的 API 客户端包含预期路由和 DTO 字段，前端类型检查通过。
- 使用目标账号的受保护只读请求成功，未授权请求按预期返回 `401` 或 `403` 认证边界且不泄露敏感细节。如果文档按策略公开，还要单独确认该暴露已获批准。
- 发布后的前端发送与 Swagger 相同的请求形状，并能正确渲染响应。

## 限制与安全说明 {#limits-and-safety}

::: warning
Swagger 反映的是当前正在运行的后端，不一定等于正在编辑的源码或前端包。每次发布后都要等待 Swagger 恢复，再从这份文档生成客户端。
:::

::: danger
Swagger UI 可以执行线上操作。所有变更按钮都应按生产能力对待，使用测试服务器和最小权限账号；不要把授权请求头或含秘密的请求体保存到截图或 Git。
:::

## 相关页面 {#related-pages}

- [发布前端与后端](../getting-started/publishing)
- [应用设置](./application-settings)
- [控制台与日志](../daily-operations/console-and-logs)
- [故障排查](../reference/troubleshooting)
