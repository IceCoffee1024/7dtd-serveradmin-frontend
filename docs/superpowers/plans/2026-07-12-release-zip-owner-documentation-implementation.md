# Release ZIP Owner Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GitHub Release ZIP installation and upgrade the primary bilingual
workflow for ServerAdmin owners, while retaining source publication guidance for
maintainers and adding a reusable bilingual Release body template.

**Architecture:** Keep existing VitePress routes and paired Chinese/English
files, but replace the lifecycle pages' source-deployment mental model with the
Release ZIP contract. A source-controlled template under `docs/superpowers/`
is deliberately manual because the actual GitHub Release repository is outside
this workspace. The existing source-publishing page remains available behind an
explicit advanced label.

**Tech Stack:** VitePress 2.0.0-alpha.18, Markdown, TypeScript VitePress
configuration, pnpm 11, Git, and a static browser preview.

---

## Starting State And Constraints

- Design authority:
  `docs/superpowers/specs/2026-07-12-release-zip-owner-documentation-design.md`
  committed as `83e79c1`.
- The Release ZIP contract is: one top-level `ServerAdmin/` directory with
  `ModInfo.xml`, backend assemblies, `wwwroot/`, and
  `Config/appsettings.Default.json`. Owner extraction target is
  `<7DTD_SERVER_ROOT>/Mods/`.
- Runtime settings are layered: shipped
  `Config/appsettings.Default.json` plus mutable, operator-managed
  `Config/appsettings.json`. The default database location is under
  `Mods/ServerAdmin/Config/`; upgrades must preserve mutable configuration and
  data after a backup.
- `IceCoffee1024/7DaysToDie-ServerAdmin` hosts the public GitHub Release, but
  neither checked-out frontend nor backend repository is that repository. Do
  not imply that this workspace can automatically publish or alter the Release
  body.
- This is docs-only work. Do not change the package layout, backend port,
  default credentials, authentication, runtime code, or screenshots.
- Keep the paths under `/zh/` and `/en/` symmetric. No production hostname,
  real credential, private server path, player ID, token, or IP address may
  appear in any new content.
- Before each commit, use `git status --short`, stage only the listed files,
  run `git diff --cached --check`, and preserve unrelated user changes.

## File Structure

**Release authoring and controls**

- Create: `docs/superpowers/release-templates/github-release-body.md` - manual
  bilingual body template for the external GitHub Release page.
- Modify: `docs/superpowers/user-manual-conventions.md` - establish the
  Release-ZIP-first rule and the mutable-configuration safety rule.
- Modify: `docs/superpowers/user-manual-coverage.md` - add lifecycle workflow
  rows in addition to console-route coverage.
- Modify: `docs/superpowers/plans/2026-07-11-bilingual-user-manual-implementation.md`
  - record this completed lifecycle-documentation amendment without reopening
  its completed original tasks.

**Public lifecycle manual**

- Modify: `docs/vitepress/en/getting-started/installation.md`
- Modify: `docs/vitepress/zh/getting-started/installation.md`
- Modify: `docs/vitepress/en/getting-started/upgrade.md`
- Modify: `docs/vitepress/zh/getting-started/upgrade.md`
- Modify: `docs/vitepress/en/getting-started/overview.md`
- Modify: `docs/vitepress/zh/getting-started/overview.md`
- Modify: `docs/vitepress/en/getting-started/initial-administrator-configuration.md`
- Modify: `docs/vitepress/zh/getting-started/initial-administrator-configuration.md`
- Modify: `docs/vitepress/en/getting-started/publishing.md`
- Modify: `docs/vitepress/zh/getting-started/publishing.md`

**Navigation and owner-facing cross-links**

- Modify: `docs/vitepress/.vitepress/config.ts` - retain all route paths and
  relabel the publishing item as advanced in both sidebars.
- Modify: `docs/vitepress/en/index.md`
- Modify: `docs/vitepress/zh/index.md`
- Modify: `docs/vitepress/en/daily-operations/dashboard.md`
- Modify: `docs/vitepress/zh/daily-operations/dashboard.md`

### Task 1: Add Release Authoring Controls

**Files:**
- Create: `docs/superpowers/release-templates/github-release-body.md`
- Modify: `docs/superpowers/user-manual-conventions.md`

- [x] **Step 1: Create the manual Release body template with its external-repository boundary.**

Create the template directory and add the following content shape. Keep the
opening HTML comment so a release publisher cannot mistake the file for an
automatically consumed GitHub configuration file.

```markdown
<!--
Copy this file into the GitHub Release body for
IceCoffee1024/7DaysToDie-ServerAdmin, or copy it to that repository and pass it
to `gh release create --notes-file`. This frontend repository does not publish
the Release automatically. Replace every <PLACEHOLDER> before publishing.
-->

# 7 Days to Die ServerAdmin <VERSION>

## English

### Release status

- Status: <BETA_OR_STABLE>
- Published: <YYYY-MM-DD>
- Recommended download: `<ASSET_NAME>`
- Intended use: <TEST_SERVER_OR_PRODUCTION_GUIDANCE>

### Compatibility and prerequisites

- 7 Days to Die: <SUPPORTED_7DTD_VERSION>
- Platform notes: <SUPPORTED_PLATFORM_NOTES>
- Required prerequisites: <VERIFIED_PREREQUISITES_OR_NONE>
- Known incompatibilities: <KNOWN_INCOMPATIBILITIES_OR_NONE>

### Verify the download

```text
<ASSET_NAME>
SHA-256: <SHA256>
```

### Install

1. Stop the dedicated server if it is running.
2. Extract `<ASSET_NAME>` into `<7DTD_SERVER_ROOT>/Mods/`.
3. Confirm that `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/ModInfo.xml` exists; do
   not create `Mods/ServerAdmin/ServerAdmin/`.
4. Start the server and open `<SERVERADMIN_URL>` from an allowed network.
5. Sign in with `<INITIAL_USERNAME>` / `<INITIAL_PASSWORD>`, then change the
   credentials before remote access.

### Upgrade and rollback

1. Stop the server and back up `Config/appsettings.json`, the ServerAdmin
   database, and relevant world/server configuration.
2. Extract the new archive into `Mods/`, replacing shipped files while keeping
   mutable configuration and data.
3. Verify startup and a read-only Dashboard or Player List request.
4. On failure, restore the matching previous archive together with the
   pre-upgrade configuration/database backup.

### Security and support

- Restrict `<SERVERADMIN_URL>` with firewall or reverse-proxy policy; do not
  expose a default password on a public port.
- Do not post live credentials, tokens, private paths, IP addresses, or player
  identifiers in reports.
- Feedback: include version, reproduction steps, sanitized server-log excerpt,
  and sanitized screenshot.

### Included modules and changes

<MODULE_SUMMARY>

### Known issues

<KNOWN_ISSUES>

---

## 中文

### 发布状态

- 状态：<BETA_OR_STABLE>
- 发布时间：<YYYY-MM-DD>
- 推荐下载：`<ASSET_NAME>`
- 适用范围：<TEST_SERVER_OR_PRODUCTION_GUIDANCE>

### 兼容性与前置条件

- 七日杀版本：<SUPPORTED_7DTD_VERSION>
- 平台说明：<SUPPORTED_PLATFORM_NOTES>
- 必需前置条件：<VERIFIED_PREREQUISITES_OR_NONE>
- 已知不兼容项：<KNOWN_INCOMPATIBILITIES_OR_NONE>

### 校验下载文件

```text
<ASSET_NAME>
SHA-256: <SHA256>
```

### 安装

1. 若专用服务器正在运行，先停止服务器。
2. 将 `<ASSET_NAME>` 解压到 `<7DTD_SERVER_ROOT>/Mods/`。
3. 确认 `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/ModInfo.xml` 存在；不要形成
   `Mods/ServerAdmin/ServerAdmin/`。
4. 启动服务器，并从允许访问的网络打开 `<SERVERADMIN_URL>`。
5. 使用 `<INITIAL_USERNAME>` / `<INITIAL_PASSWORD>` 登录；开放远程访问前
   立即修改凭据。

### 升级与回滚

1. 停止服务器，备份 `Config/appsettings.json`、ServerAdmin 数据库及相关
   世界/服务器配置。
2. 将新压缩包解压到 `Mods/`，替换随包文件，同时保留可写配置和数据。
3. 验证服务器启动，并在仪表盘或玩家列表执行一次只读检查。
4. 若失败，恢复匹配的上一版压缩包以及升级前的配置/数据库备份。

### 安全与支持

- 使用防火墙或反向代理策略限制 `<SERVERADMIN_URL>`；不要将默认密码的
  管理端口直接暴露到公网。
- 报告中不得包含真实凭据、令牌、私有路径、IP 地址或玩家标识。
- 反馈请提供版本、复现步骤、脱敏后的服务器日志片段和截图。

### 包含模块与变更

<MODULE_SUMMARY>

### 已知问题

<KNOWN_ISSUES>
```

- [x] **Step 2: Add permanent Release-ZIP-first conventions.**

Append these bullets to the relevant `Audience And Scope`, `Content Standards`,
and `Validation` sections of `user-manual-conventions.md`:

```markdown
- Treat a verified GitHub Release ZIP as the normal installation and upgrade
  path for server owners. Source builds, frontend environment variables, API
  generation, Swagger, and static hosting belong only in clearly labeled
  maintainer guidance.
- Installation and upgrade pages must show the expected
  `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/ModInfo.xml` placement and warn against
  a nested `Mods/ServerAdmin/ServerAdmin/` directory.
- When the product has shipped defaults plus a writable override, document the
  upgrade rule explicitly: replace released defaults, but back up and preserve
  mutable configuration and database files.
- Release communication must name one recommended asset, compatibility,
  verified prerequisites, checksum, security/initial-login guidance, upgrade
  preservation rules, rollback boundary, known issues, and a sanitized support
  report format.
```

- [x] **Step 3: Run focused template and convention checks.**

Run:

```powershell
rg -n "<ASSET_NAME>|SHA-256|Mods/ServerAdmin/ServerAdmin|<INITIAL_PASSWORD>" docs\superpowers\release-templates\github-release-body.md
rg -n -i "Release ZIP|nested|mutable configuration|checksum" docs\superpowers\user-manual-conventions.md
git diff --check
```

Expected: each required release field and all four convention topics appear;
`git diff --check` produces no output.

- [x] **Step 4: Commit the release-authoring controls.**

Run:

```powershell
git add docs/superpowers/release-templates/github-release-body.md docs/superpowers/user-manual-conventions.md
git diff --cached --check
git commit -m "docs: add release zip publication template"
```

Expected: the commit contains only the template and conventions files.

### Task 2: Rewrite Paired Owner Installation And Upgrade Pages

**Files:**
- Modify: `docs/vitepress/en/getting-started/installation.md`
- Modify: `docs/vitepress/zh/getting-started/installation.md`
- Modify: `docs/vitepress/en/getting-started/upgrade.md`
- Modify: `docs/vitepress/zh/getting-started/upgrade.md`

- [x] **Step 1: Replace the English installation page with the Release ZIP procedure.**

Retain `outline: deep` and use this exact section structure and operational
content:

```markdown
# Install from a Release ZIP

> For a 7 Days to Die dedicated-server owner or administrator. Requires a
> Release asset compatible with the server, filesystem access to
> `<7DTD_SERVER_ROOT>/Mods/`, and an approved initial administrator account.

## Purpose

Install the packaged ServerAdmin backend and web console together as one mod;
no frontend repository or source build is required.

## Before you begin

- Read the selected Release's compatibility, prerequisites, known issues,
  recommended asset name, and SHA-256 value when one is published.
- Back up an existing `Mods/ServerAdmin/` directory before replacing it.
- Decide whether the browser will run on the server host or a permitted remote
  network; do not expose initial credentials on a public port.

## Procedure

1. Stop the dedicated server if it is running and download the exact
   `ServerAdmin.v<version>.zip` asset named by the Release.
2. Verify the published SHA-256 when available, then extract the archive into
   `<7DTD_SERVER_ROOT>/Mods/`.
3. Confirm that `ModInfo.xml` is directly under
   `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/`. Move files when the result is
   `Mods/ServerAdmin/ServerAdmin/`.
4. Start the dedicated server normally and wait for the ServerAdmin mod to
   load. Open the configured server URL; `http://localhost:<PORT>/` works only
   from the server host.
5. Sign in with the release-provided initial account, change its credentials
   immediately, and restrict remote access with the server's network policy.

## Verify the result

- The server log shows the mod loaded without a compatibility or dependency
  failure.
- The login page opens at the configured URL and a successful login shows
  Dashboard or another read-only page.

## Limits and safety notes

::: warning
The Release notes, not an undocumented dependency list, define the supported
game version and prerequisites. Do not install Node.js, pnpm, or frontend source
files to diagnose a mod-loading problem.
:::

::: danger
Do not expose a known initial credential on a public management port. Change it
before remote access and restrict the port with a firewall or reverse proxy.
:::
```

Add Related pages for Upgrade, Initial administrator configuration, Advanced
source publishing, Backup and recovery, and Troubleshooting. Do not include
`.env`, `VITE_*`, Swagger, `api:gen`, CORS, static-hosting, or reverse-proxy
setup as an owner installation step.

- [x] **Step 2: Replace the Chinese installation page with the matching localized procedure.**

Use the same frontmatter, file paths, placeholders, and warning boundaries.
Use these fixed localized headings and procedure actions:

```markdown
# 从 Release ZIP 安装

> 面向七日杀专用服务器服主或管理员。需要与服务器兼容的 Release 发布包、
> `<7DTD_SERVER_ROOT>/Mods/` 的文件访问权限，以及已批准的初始管理账号。

## 目的

将打包好的 ServerAdmin 后端和 Web 管理台作为一个模组安装；不需要前端仓库或源码构建。

## 开始前

## 操作步骤

1. 若专用服务器正在运行，先停止服务器，并下载 Release 指定的
   `ServerAdmin.v<version>.zip`。
2. 有校验值时验证 SHA-256，然后解压到 `<7DTD_SERVER_ROOT>/Mods/`。
3. 确认 `ModInfo.xml` 直接位于
   `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/`；若形成
   `Mods/ServerAdmin/ServerAdmin/`，移动内层目录的内容。
4. 正常启动专用服务器并等待 ServerAdmin 模组加载。打开已配置的管理地址；
   `http://localhost:<PORT>/` 只适用于在服务器主机上打开浏览器。
5. 使用 Release 提供的初始账号登录，立即修改凭据，并用服务器网络策略限制远程访问。

## 验证结果
## 限制与安全说明
```

Localize the English `Before you begin`, verification bullets, warning, danger
container, and Related pages without changing technical tokens or paths.

- [x] **Step 3: Replace the English upgrade page with the Release ZIP preservation and rollback procedure.**

Retain `outline: deep` and write this workflow:

```markdown
# Upgrade with a Release ZIP

> For an administrator with a maintenance window and backup access. Requires
> the current Release ZIP, a compatible target Release ZIP, and a recoverable
> backup of ServerAdmin configuration and data.

## Purpose

Replace released program files while retaining the operator-managed
configuration and database needed by the live server.

## Before you begin

- Record the running ServerAdmin version and retain its archive or extracted
  program directory as a rollback candidate.
- Back up `ServerAdmin/Config/appsettings.json`, the ServerAdmin database, and
  relevant game-server configuration/world data.
- Read the target Release's compatibility, prerequisites, known issues, and
  required manual configuration changes.

## Procedure

1. Notify players, stop the dedicated server, and confirm the backup can be
   located before replacing files.
2. Extract the new archive into `<7DTD_SERVER_ROOT>/Mods/`. Replace released
   assemblies, dependencies, `wwwroot/`, and `Config/appsettings.Default.json`.
3. Preserve `Config/appsettings.json` and the ServerAdmin database. The default
   file supplies shipped values; the writable override supplies administrator
   changes.
4. Start the server, inspect the mod-load result, sign in, and perform a
   read-only Dashboard or Player List check.
5. If startup, authentication, or migration fails, stop the server and restore
   the matching prior program files together with the pre-upgrade configuration
   and database backup.

## Verify the result

- The server loads the target version without a new dependency or migration
  failure.
- Existing administrator configuration and the expected management data remain
  available after login.

## Limits and safety notes

::: danger
After a database migration, restoring only old binaries is not a safe rollback.
Restore the matching pre-upgrade database and configuration backup as well.
:::
```

Add Related pages for Installation, Initial administrator configuration,
Backup and recovery, Troubleshooting, and Advanced source publishing.

- [x] **Step 4: Replace the Chinese upgrade page with the matching localized procedure.**

Use these fixed title, purpose, preservation rule, and rollback warning while
localizing all explanatory prose:

```markdown
# 通过 Release ZIP 升级

## 目的

替换发布包中的程序文件，同时保留线上服务器需要的管理员配置和数据库。

## 操作步骤

1. 通知玩家、停止专用服务器，并确认能定位到可恢复的备份后再替换文件。
2. 将新压缩包解压到 `<7DTD_SERVER_ROOT>/Mods/`，替换程序集、依赖、`wwwroot/`
   和 `Config/appsettings.Default.json`。
3. 保留 `Config/appsettings.json` 与 ServerAdmin 数据库。默认配置文件提供随包默认值，
   可写覆盖文件保存管理员修改。
4. 启动服务器，检查模组加载结果，登录后在仪表盘或玩家列表执行一次只读检查。
5. 若启动、认证或迁移失败，停止服务器，并恢复相互匹配的旧程序文件以及升级前的
   配置和数据库备份。

::: danger
数据库迁移后，只恢复旧二进制文件不是安全回滚；必须同时恢复匹配的升级前数据库和配置备份。
:::
```

- [x] **Step 5: Verify owner-page language parity and absence of source-deployment prerequisites.**

Run:

```powershell
$ownerPages = @(
  'docs/vitepress/en/getting-started/installation.md',
  'docs/vitepress/zh/getting-started/installation.md',
  'docs/vitepress/en/getting-started/upgrade.md',
  'docs/vitepress/zh/getting-started/upgrade.md'
)
rg -n "Mods/ServerAdmin/ServerAdmin|appsettings.Default.json|appsettings.json|database" $ownerPages
$sourceDeploymentMatches = rg -n -i "pnpm|vite_|swagger|api:gen|static host|cors" $ownerPages
if ($LASTEXITCODE -eq 0) { throw "Owner pages still contain source-deployment prerequisites: $sourceDeploymentMatches" }
if ($LASTEXITCODE -gt 1) { exit $LASTEXITCODE }
Write-Output 'No source-deployment prerequisites in owner pages.'
```

Expected: the first search finds folder and preservation rules; the second
search finds no owner prerequisite. Check both language files manually for the
same number and order of workflow operations.

- [x] **Step 6: Commit the owner lifecycle pages.**

Run:

```powershell
git add docs/vitepress/en/getting-started/installation.md docs/vitepress/zh/getting-started/installation.md docs/vitepress/en/getting-started/upgrade.md docs/vitepress/zh/getting-started/upgrade.md
git diff --cached --check
git commit -m "docs: simplify release zip owner setup"
```

Expected: the commit contains only the four owner installation/upgrade pages.

### Task 3: Reposition Source Publishing And Repair Owner-Facing Navigation

**Files:**
- Modify: `docs/vitepress/.vitepress/config.ts`
- Modify: `docs/vitepress/en/getting-started/overview.md`
- Modify: `docs/vitepress/zh/getting-started/overview.md`
- Modify: `docs/vitepress/en/getting-started/initial-administrator-configuration.md`
- Modify: `docs/vitepress/zh/getting-started/initial-administrator-configuration.md`
- Modify: `docs/vitepress/en/getting-started/publishing.md`
- Modify: `docs/vitepress/zh/getting-started/publishing.md`
- Modify: `docs/vitepress/en/index.md`
- Modify: `docs/vitepress/zh/index.md`
- Modify: `docs/vitepress/en/daily-operations/dashboard.md`
- Modify: `docs/vitepress/zh/daily-operations/dashboard.md`

- [x] **Step 1: Reframe both overview pages around the packaged mod boundary.**

Replace source-build wording with these assertions in both locale pages:

```text
Normal owner deployment = one Release ZIP extracted as Mods/ServerAdmin.
The package contains the server mod and its web console.
Installation -> initial administrator configuration -> daily operations is the
normal sequence.
Build and publish from source is an advanced maintainer workflow only.
```

Keep the product-boundary explanation, safety notes, and daily-operations
links. Remove the requirement to prepare a frontend workspace, API base URL, or
generate an API client before an owner can install.

- [x] **Step 2: Make the initial-administrator pages start after packaged login.**

Replace the opening prerequisite and connectivity procedure with these rules in
both languages:

```text
Prerequisite: the Release ZIP was installed, the dedicated server loaded the
mod, and the packaged web console opens at its configured URL.
First action: sign in with the Release-provided initial account and change it
before remote access.
Connectivity verification: dashboard and a protected read-only page return
data; a failure is investigated with server startup, port, firewall, and
Troubleshooting guidance.
```

Keep permissions, feature availability, explicit time zones, and first backup
test. Move any Swagger/client-generation discussion into a Related pages link
to Advanced source publishing or API Documentation, not the owner procedure.

- [x] **Step 3: Retitle and retain the maintainer-only publishing pages.**

Use these titles and opening summaries while keeping the existing reviewed
backend publish -> restart -> non-empty Swagger -> `pnpm api:gen` -> checks ->
frontend publication sequence intact:

```markdown
# Advanced: build and publish from source

> For maintainers and deployment engineers changing backend APIs or building a
> custom frontend. Server owners installing a GitHub Release ZIP should use
> [Install from a Release ZIP](./installation) and do not need this workflow.
```

```markdown
# 高级：从源码构建与发布

> 面向修改后端 API 或构建自定义前端的维护者和部署工程师。通过 GitHub
> Release ZIP 安装的服主应使用[从 Release ZIP 安装](./installation)，无需执行本流程。
```

- [x] **Step 4: Change sidebar, language-home, and Dashboard cross-links without changing routes.**

Make these exact navigation replacements in `config.ts`:

```ts
{ text: '高级：从源码构建与发布', link: '/zh/getting-started/publishing' },
{ text: 'Advanced: build and publish from source', link: '/en/getting-started/publishing' },
```

Update both language index pages so the first three lifecycle descriptions say
that owners download a Release ZIP, extract it into `Mods`, and back up/preserve
configuration before upgrade. Replace their publishing list entry with the
advanced title and source-maintainer audience.

Replace the Dashboard opening cross-link to publishing with its locale-matched
Troubleshooting page:

```markdown
[Troubleshooting](../reference/troubleshooting)
[故障排查](../reference/troubleshooting)
```

Keep all URLs unchanged; only page labels, summaries, and owner-facing recovery
links change.

- [x] **Step 5: Build and inspect navigation-focused content.**

Run:

```powershell
pnpm docs:build
$navigationFiles = @(
  'docs/vitepress/.vitepress/config.ts',
  'docs/vitepress/en/index.md',
  'docs/vitepress/zh/index.md',
  'docs/vitepress/en/getting-started/publishing.md',
  'docs/vitepress/zh/getting-started/publishing.md'
)
rg -n "Advanced: build and publish from source|高级：从源码构建与发布" $navigationFiles
rg -n "Troubleshooting" docs\vitepress\en\daily-operations\dashboard.md
rg -n "故障排查" docs\vitepress\zh\daily-operations\dashboard.md
```

Expected: the static build exits `0`, both labels appear in sidebar/home/publishing
content, and Dashboard now links to Troubleshooting rather than source
publication.

- [x] **Step 6: Commit source-workflow repositioning and cross-links.**

Run:

```powershell
git add docs/vitepress/.vitepress/config.ts docs/vitepress/en/getting-started/overview.md docs/vitepress/zh/getting-started/overview.md docs/vitepress/en/getting-started/initial-administrator-configuration.md docs/vitepress/zh/getting-started/initial-administrator-configuration.md docs/vitepress/en/getting-started/publishing.md docs/vitepress/zh/getting-started/publishing.md docs/vitepress/en/index.md docs/vitepress/zh/index.md docs/vitepress/en/daily-operations/dashboard.md docs/vitepress/zh/daily-operations/dashboard.md
git diff --cached --check
git commit -m "docs: separate owner and source workflows"
```

Expected: no route path changes and no unrelated daily-operations page edits.

### Task 4: Update Lifecycle Coverage And Historical Plan Status

**Files:**
- Modify: `docs/superpowers/user-manual-coverage.md`
- Modify: `docs/superpowers/plans/2026-07-11-bilingual-user-manual-implementation.md`

- [x] **Step 1: Extend the coverage matrix without weakening console-route coverage.**

After the existing console-route table and before `## Review rules`, add this
section and mark rows `Complete` only after Task 5 verification succeeds:

```markdown
## Lifecycle documentation

Lifecycle pages do not correspond to a console route, but they are reviewed
with the same paired-language and built-link standard.

| Workflow | Chinese destination | English destination | Documentation status | Review |
| --- | --- | --- | --- | --- |
| Release ZIP installation | [/zh/getting-started/installation](/zh/getting-started/installation) | [/en/getting-started/installation](/en/getting-started/installation) | Authored | Not reviewed |
| Release ZIP upgrade | [/zh/getting-started/upgrade](/zh/getting-started/upgrade) | [/en/getting-started/upgrade](/en/getting-started/upgrade) | Authored | Not reviewed |
| Initial administrator configuration | [/zh/getting-started/initial-administrator-configuration](/zh/getting-started/initial-administrator-configuration) | [/en/getting-started/initial-administrator-configuration](/en/getting-started/initial-administrator-configuration) | Authored | Not reviewed |
| Advanced source publishing | [/zh/getting-started/publishing](/zh/getting-started/publishing) | [/en/getting-started/publishing](/en/getting-started/publishing) | Authored | Not reviewed |
```

Revise the opening explanation to say the matrix has console-route coverage
plus this lifecycle section; do not change existing route rows.

- [x] **Step 2: Record the completed amendment in the original manual plan.**

After Task 3's public-documentation commit, run
`$ownerWorkflowCommit = git rev-parse --short HEAD`. Under
`## Implementation Status` in
`2026-07-11-bilingual-user-manual-implementation.md`, add a completed note
whose first line substitutes the command output for `$ownerWorkflowCommit`
before saving:

```markdown
- The 2026-07-12 Release ZIP owner-documentation amendment is complete in
  $ownerWorkflowCommit: Release ZIP installation and upgrade are the primary owner
  workflow, source publishing is explicitly advanced, and the reusable
  bilingual Release body template is recorded in
  `docs/superpowers/release-templates/github-release-body.md`.
```

Do not alter the original Task 1-9 checkboxes or their historical completion
claims.

- [x] **Step 3: Verify the maintenance artifacts.**

Run:

```powershell
rg -n "Lifecycle documentation|Release ZIP installation|Advanced source publishing" docs\superpowers\user-manual-coverage.md
rg -n "Release ZIP owner-documentation amendment|github-release-body.md" docs\superpowers\plans\2026-07-11-bilingual-user-manual-implementation.md
git diff --check
```

Expected: all lifecycle rows and the amendment note are present, existing
console-route coverage remains intact, and no whitespace error is reported.

- [x] **Step 4: Commit the lifecycle coverage and historical status update.**

Run:

```powershell
git add docs/superpowers/user-manual-coverage.md docs/superpowers/plans/2026-07-11-bilingual-user-manual-implementation.md
git diff --cached --check
git commit -m "docs: track release zip lifecycle coverage"
```

Expected: the public owner-workflow commit is already known and accurately
referenced; the commit contains only coverage and historical-plan maintenance.

### Task 5: Perform Static Acceptance And Record Final Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-12-release-zip-owner-documentation-implementation.md`
- Verify: all files listed in Tasks 1-4

- [x] **Step 1: Verify paired page paths and owner-content boundaries.**

Run:

```powershell
$zh = Get-ChildItem docs\vitepress\zh -File -Recurse | ForEach-Object { $_.FullName.Replace((Resolve-Path docs\vitepress\zh).Path, '') }
$en = Get-ChildItem docs\vitepress\en -File -Recurse | ForEach-Object { $_.FullName.Replace((Resolve-Path docs\vitepress\en).Path, '') }
$pathDifferences = Compare-Object $zh $en
if ($null -ne $pathDifferences) {
  $pathDifferences
  throw 'Chinese and English documentation trees differ.'
}

$ownerPages = @(
  'docs/vitepress/en/getting-started/installation.md',
  'docs/vitepress/zh/getting-started/installation.md',
  'docs/vitepress/en/getting-started/upgrade.md',
  'docs/vitepress/zh/getting-started/upgrade.md'
)
$sourceDeploymentMatches = rg -n -i "pnpm|vite_|swagger|api:gen|static host|cors" $ownerPages
if ($LASTEXITCODE -eq 0) { throw "Owner pages still contain source-deployment prerequisites: $sourceDeploymentMatches" }
if ($LASTEXITCODE -gt 1) { exit $LASTEXITCODE }
Write-Output 'Owner pages contain no source-deployment prerequisites.'
```

Expected: the path comparison produces no output and the source-tooling scan
prints only the explicit no-match confirmation.

- [x] **Step 2: Build the VitePress static artifact.**

Run:

```powershell
pnpm docs:build
```

Expected: exit code `0` and updated output under
`docs/vitepress/.vitepress/dist/`.

- [x] **Step 3: Inspect the built Chinese and English owner paths.**

Run:

```powershell
$preview = Start-Process -WindowStyle Hidden -PassThru -FilePath pnpm.cmd -ArgumentList 'docs:preview', '--host', '127.0.0.1', '--port', '4173'
```

Open `/zh/getting-started/installation`, `/zh/getting-started/upgrade`,
`/en/getting-started/installation`, and `/en/getting-started/upgrade`. Confirm
the Release ZIP title, folder tree, configuration-preservation guidance,
advanced publishing label, language switching, and no horizontal overflow.

If the VitePress alpha preview repeats its known static-asset `404` behavior,
stop the preview process and serve the already-built directory instead:

```powershell
if ($null -ne $preview -and $preview.HasExited -eq $false) { Stop-Process -Id $preview.Id }
Start-Process -WindowStyle Hidden -FilePath python -ArgumentList '-m', 'http.server', '4173', '--directory', 'docs/vitepress/.vitepress/dist'
```

Repeat the same four URL checks against the plain static server. Use Chrome
DevTools MCP when available; no screenshot capture is required. Stop the server
process that was started for preview after the checks complete.

- [x] **Step 4: Mark lifecycle review rows complete and record the verification in this plan.**

After Steps 1-3 succeed, change all four lifecycle table rows from `Authored`
and `Not reviewed` to `Complete`. Mark every completed checkbox in this plan as
`[x]`, including the final commit step before staging its verification record.
Do not add a placeholder for a future commit hash; the historical plan already
records the concrete public owner workflow commit from Task 3.

- [x] **Step 5: Commit final verification state.**

Run:

```powershell
git status --short
git add docs/superpowers/user-manual-coverage.md docs/superpowers/plans/2026-07-12-release-zip-owner-documentation-implementation.md
git diff --cached --check
git commit -m "docs: finalize release zip owner manual"
git show --check --stat --oneline HEAD
git status --short
```

Expected: the commit contains only the lifecycle coverage completion and final
plan status; the final status preserves no accidental generated VitePress files
or unrelated user changes.

## Plan Self-Review

- **Spec coverage:** Task 1 implements the manual Release body and conventions;
  Task 2 implements the primary owner install/upgrade path and rollback safety;
  Task 3 separates advanced source publishing and repairs all discovered
  owner-facing cross-links; Task 4 records lifecycle coverage and historical
  status; Task 5 verifies parity, static output, navigation, and commit state.
- **Scope:** The plan does not alter package generation, runtime configuration,
  backend authentication, default credentials, Release assets, or screenshots.
- **No unresolved implementation placeholders:** angle-bracket strings occur
  only in intentional Release-template and sanitized-documentation examples.
  The historical-plan note uses a concrete Task 3 commit before Task 4 is
  committed.
- **Consistency:** Every public route remains unchanged; technical file names
  and command names are identical across locales; owner pages explicitly avoid
  source-deployment prerequisites.
