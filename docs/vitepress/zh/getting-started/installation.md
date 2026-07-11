# 安装

## 适用范围、角色与前置条件

本页面向负责部署的管理员。准备：可维护的 7DTD 服务器、`<7DTD_SERVER_ROOT>`、后端源码或发布物、Node.js 与 pnpm，以及一个可供浏览器访问的 `<SERVERADMIN_API_BASE_URL>`。需要能在维护窗口重启游戏服务器并读取 Swagger。

## 目的

安装完成后，后端应能在游戏进程旁提供 API，前端应能加载并指向该 API，管理员可以登录并看到仪表盘数据。

## 步骤

1. **准备后端配置。** 将后端发布物部署到 `<7DTD_SERVER_ROOT>` 对应的 ServerAdmin 模组位置，按部署环境设置 Web URL、管理员账号、数据库路径和日志选项。不要把生产密码提交到仓库。
2. **启动并验证后端。** 启动 7DTD 服务器，确认后端监听 `<SERVERADMIN_API_BASE_URL>`。请求 `<SERVERADMIN_API_BASE_URL>/swagger/v1/swagger.json`，只在返回 HTTP 200 且 JSON 非空后继续。
3. **准备前端依赖。** 在前端仓库执行 `pnpm install`。跨域部署时设置 `VITE_OPENAPI_BASE_URL=<SERVERADMIN_API_BASE_URL>`；同源部署留空，并按部署子路径设置 `VITE_APP_PUBLIC_BASE_PATH`。
4. **构建前端。** 执行 `pnpm build`，把生成的静态文件发布到受支持的静态站点或反向代理。让 `/api`、`/swagger` 和前端页面路由按部署方式可达。
5. **首次访问。** 打开前端页面，选择正确语言并使用部署时提供的管理员账号登录。若页面能打开但请求失败，先检查 API 基地址、反向代理和浏览器 Network。

## 可观察的验证

- Swagger URL 返回非空 JSON，且浏览器 Network 中 API 请求指向预期的 `<SERVERADMIN_API_BASE_URL>`。
- 登录后，仪表盘显示在线/离线状态、FPS 或内存等采样；后端不可达时应显示错误或空状态，而不是伪造成功。
- 玩家列表和控制台能够加载权限允许的命令列表；未启用模块在功能模块页面明确显示不可用。

## 限制与安全

- `VITE_*` 值会暴露给浏览器，不能放令牌、密码或其他秘密。
- 发布静态文件不会自动启动后端，也不会替代 7DTD 的存档与配置备份。
- 反向代理、HTTPS、CORS 和认证策略属于部署环境；变更后必须重新执行 Swagger、登录和 API 请求验证。

## 相关页面

- [升级](./upgrade)
- [初始管理员配置](./initial-administrator-configuration)
- [前后端发布](./publishing)
- [仪表盘](../daily-operations/dashboard)
- [备份与恢复](../automation-and-reliability/backup-and-recovery)
