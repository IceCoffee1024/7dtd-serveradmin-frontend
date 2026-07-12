<!--
Copy this file into the GitHub Release body for
IceCoffee1024/7DaysToDie-ServerAdmin, or copy it to that repository and pass it
to `gh release create --notes-file`. This frontend repository does not publish
the Release automatically. Replace every {{PLACEHOLDER}} before publishing.
-->

# 7 Days to Die ServerAdmin {{VERSION}}

## English

### Release status

- Status: {{BETA_OR_STABLE}}
- Published: {{YYYY_MM_DD}}
- Recommended download: `{{ASSET_NAME}}`
- Intended use: {{TEST_SERVER_OR_PRODUCTION_GUIDANCE}}

### Compatibility and prerequisites

- 7 Days to Die: {{SUPPORTED_7DTD_VERSION}}
- Platform notes: {{SUPPORTED_PLATFORM_NOTES}}
- Required prerequisites: {{VERIFIED_PREREQUISITES_OR_NONE}}
- Optional dependency: `0_TFP_Harmony`. ServerAdmin starts without it, but Harmony-based features may be unavailable when it is missing. Install or confirm it only when the Release compatibility notes say the required features need it.
- Known incompatibilities: {{KNOWN_INCOMPATIBILITIES_OR_NONE}}

### Verify the download

```text
{{ASSET_NAME}}
SHA-256: {{SHA256}}
```

### Install

1. Stop the dedicated server if it is running.
2. Extract `{{ASSET_NAME}}` into `{{7DTD_SERVER_ROOT}}/Mods/`.
3. Confirm that `{{7DTD_SERVER_ROOT}}/Mods/ServerAdmin/ModInfo.xml` exists; do not create `Mods/ServerAdmin/ServerAdmin/`.
4. Start the server and open `{{SERVERADMIN_URL}}` from an allowed network.
5. Sign in with `{{INITIAL_USERNAME}}` / `{{INITIAL_PASSWORD}}`, then change the credentials before remote access.

### Upgrade and rollback

1. Stop the server and back up `{{7DTD_SERVER_ROOT}}/Mods/ServerAdmin/Config/appsettings.json`, the configured ServerAdmin database (`{{SERVERADMIN_DATABASE_FILE}}`), and relevant world/server configuration.
2. Extract the new archive into `{{7DTD_SERVER_ROOT}}/Mods/`.
3. Replace the released assemblies/dependencies, `wwwroot/`, and `Config/appsettings.Default.json`; retain `Config/appsettings.json` and `{{SERVERADMIN_DATABASE_FILE}}`.
4. Verify startup and a read-only Dashboard or Player List request.
5. On failure, restore the matching prior archive plus the pre-upgrade configuration/database backup.

### Security and support

- Restrict `{{SERVERADMIN_URL}}` with firewall or reverse-proxy policy; do not expose a default password on a public port.
- Do not post live credentials, tokens, private paths, IP addresses, or player identifiers in reports.
- Feedback: include version, reproduction steps, sanitized server-log excerpt, and sanitized screenshot.

### Included modules and changes

{{MODULE_SUMMARY}}

### Known issues

{{KNOWN_ISSUES}}

---

## 中文

### 发布状态

- 状态：{{BETA_OR_STABLE}}
- 发布时间：{{YYYY_MM_DD}}
- 推荐下载：`{{ASSET_NAME}}`
- 适用范围：{{TEST_SERVER_OR_PRODUCTION_GUIDANCE}}

### 兼容性与前置条件

- 七日杀版本：{{SUPPORTED_7DTD_VERSION}}
- 平台说明：{{SUPPORTED_PLATFORM_NOTES}}
- 必需前置条件：{{VERIFIED_PREREQUISITES_OR_NONE}}
- 可选依赖：`0_TFP_Harmony`。没有它 ServerAdmin 仍可启动，但基于 Harmony 的功能可能不可用。仅当 Release 兼容性说明表明所需功能依赖它时，才安装或确认它。
- 已知不兼容项：{{KNOWN_INCOMPATIBILITIES_OR_NONE}}

### 校验下载文件

```text
{{ASSET_NAME}}
SHA-256: {{SHA256}}
```

### 安装

1. 若专用服务器正在运行，先停止服务器。
2. 将 `{{ASSET_NAME}}` 解压到 `{{7DTD_SERVER_ROOT}}/Mods/`。
3. 确认 `{{7DTD_SERVER_ROOT}}/Mods/ServerAdmin/ModInfo.xml` 存在；不要形成 `Mods/ServerAdmin/ServerAdmin/`。
4. 启动服务器，并从允许访问的网络打开 `{{SERVERADMIN_URL}}`。
5. 使用 `{{INITIAL_USERNAME}}` / `{{INITIAL_PASSWORD}}` 登录；开放远程访问前立即修改凭据。

### 升级与回滚

1. 停止服务器，备份 `{{7DTD_SERVER_ROOT}}/Mods/ServerAdmin/Config/appsettings.json`、已配置的 ServerAdmin 数据库（`{{SERVERADMIN_DATABASE_FILE}}`）及相关世界/服务器配置。
2. 将新压缩包解压到 `{{7DTD_SERVER_ROOT}}/Mods/`。
3. 替换随包发布的程序集/依赖项、`wwwroot/` 和 `Config/appsettings.Default.json`；保留 `Config/appsettings.json` 和 `{{SERVERADMIN_DATABASE_FILE}}`。
4. 验证服务器启动，并在仪表盘或玩家列表执行一次只读检查。
5. 若失败，恢复匹配的上一版压缩包以及升级前的配置/数据库备份。

### 安全与支持

- 使用防火墙或反向代理策略限制 `{{SERVERADMIN_URL}}`；不要将默认密码的管理端口直接暴露到公网。
- 报告中不得包含真实凭据、令牌、私有路径、IP 地址或玩家标识。
- 反馈请提供版本、复现步骤、脱敏后的服务器日志片段和截图。

### 包含模块与变更

{{MODULE_SUMMARY}}

### 已知问题

{{KNOWN_ISSUES}}
