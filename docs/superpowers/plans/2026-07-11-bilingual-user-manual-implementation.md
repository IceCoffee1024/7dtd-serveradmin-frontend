# Bilingual VitePress User Manual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the VitePress starter site with a complete, paired Chinese and English user manual for the current ServerAdmin console.

**Architecture:** Keep `docs/vitepress/` as a static VitePress site. A root language chooser leads to symmetric `/zh/` and `/en/` content trees, while the default VitePress theme supplies navigation, local search, and last-updated metadata. A private coverage matrix, page template, and screenshot manifest under `docs/superpowers/` keep the published manual complete and maintainable.

**Tech Stack:** VitePress 2.0.0-alpha.18, Markdown, pnpm 11, Chrome DevTools MCP, the existing Vue 3 administration console, and the existing local frontend/backend sync runbook.

## Implementation Status

- Tasks 1-7 were completed in the documented commits from `9b73386` through `c8bbd5b`.
- Tasks 8 and 9 are complete: 22 separately captured, locale-matched images are embedded, verified in the static artifact, and recorded by the final documentation commit.

### 2026-07-12 Release ZIP owner-documentation amendment

- The 2026-07-12 Release ZIP owner-documentation amendment is implemented across `3d81084` (reusable bilingual release template), `0752782` (initial primary owner installation and upgrade workflows), `b5638ed` (configured `DatabasePath` and permitted remote-access clarification), `2ebecf1` (rollback-path correction), and `13a5d8c` (owner/source publishing separation); final static acceptance passed.
- Release ZIP installation and upgrade are the primary owner workflows; source publishing is explicitly advanced. The reusable bilingual release body template is at `docs/superpowers/release-templates/github-release-body.md`.

---

## Starting State And Commit Boundary

- `package.json`, `pnpm-lock.yaml`, and `docs/vitepress/` are currently user-created, uncommitted VitePress bootstrap changes. Preserve their useful content and do not revert them.
- The existing `docs:dev`, `docs:build`, and `docs:preview` scripts are the documentation build interface. Do not add a second documentation toolchain.
- Before every commit, inspect `git status --short` and stage only the files intentionally changed by the current task. Do not stage unrelated user work.
- The local `LOCAL_FRONTEND_BACKEND_SYNC.md` is ignored on purpose. Use it as a factual source for publishing guidance, but do not publish its private paths, hostnames, tokens, or credentials in the user manual.

## File Structure

**Configuration and internal controls**

- Modify: `docs/vitepress/.vitepress/config.ts` - replace starter navigation with two localized manual trees, local search, and last-updated metadata.
- Modify: `docs/vitepress/index.md` - replace starter home with language entry.
- Delete: `docs/vitepress/markdown-examples.md` - remove VitePress starter page.
- Delete: `docs/vitepress/api-examples.md` - remove VitePress starter page.
- Create: `docs/superpowers/user-manual-coverage.md` - one row per current console route, with paired page links and review state.
- Create: `docs/superpowers/user-manual-page-template.md` - required page contract for authors.
- Create: `docs/superpowers/user-manual-screenshot-manifest.md` - localized screenshot inventory, route, caption, and review state.

**Chinese and English manual trees, with the same relative paths**

```text
docs/vitepress/{zh,en}/
  index.md
  getting-started/
    overview.md
    installation.md
    upgrade.md
    initial-administrator-configuration.md
    publishing.md
  daily-operations/
    dashboard.md
    players.md
    gps-map.md
    game-chat.md
    console-and-logs.md
  game-and-player-management/
    feature-modules.md
    game-items.md
    economy.md
    teleport.md
    announcements-and-voting.md
    achievements-and-rewards.md
    player-tracking.md
  automation-and-reliability/
    restart.md
    scheduler.md
    event-automation.md
    backup-and-recovery.md
  integrations-and-access/
    server-configuration.md
    access-control.md
    mod-management.md
    discord-integration.md
    geoip-access-control.md
    application-settings.md
    api-documentation.md
  reference/
    console-menu-index.md
    administrator-commands.md
    troubleshooting.md
    terminology.md
```

**Localized static media**

```text
docs/vitepress/public/images/
  zh/{daily-operations,game-and-player-management,automation-and-reliability,integrations-and-access}/
  en/{daily-operations,game-and-player-management,automation-and-reliability,integrations-and-access}/
```

### Task 1: Preserve The Bootstrap And Create Coverage Controls

**Files:**
- Create: `docs/superpowers/user-manual-coverage.md`
- Create: `docs/superpowers/user-manual-page-template.md`
- Create: `docs/superpowers/user-manual-screenshot-manifest.md`
- Reference: `src/router/index.ts`
- Reference: `docs/superpowers/specs/2026-07-11-bilingual-user-manual-design.md`

- [x] **Step 1: Record the implementation baseline before changing documentation files.**

Run:

```powershell
git status --short
pnpm docs:build
```

Expected: the status shows the existing user-owned bootstrap changes, and the starter VitePress site builds successfully. Record the exact baseline in implementation notes, but do not commit or edit unrelated files.

- [x] **Step 2: Create the route coverage matrix with one row per route.**

Create `docs/superpowers/user-manual-coverage.md` with the columns `Route`, `Console path`, `Chinese destination`, `English destination`, `Screenshot`, and `Review`. Use `Complete` only after both pages exist and are reviewed. Map the current route names to these exact manual destinations:

```text
Dashboard -> daily-operations/dashboard
PlayerList -> daily-operations/players
PlayerProfile -> daily-operations/players#player-profile
GPSMap -> daily-operations/gps-map
FeatureModules -> game-and-player-management/feature-modules
GameChat -> daily-operations/game-chat
LiveChat -> daily-operations/game-chat#live-chat
ChatHistory -> daily-operations/game-chat#chat-history
ChatSettings -> daily-operations/game-chat#chat-settings
ColoredChat -> daily-operations/game-chat#colored-chat
Economy -> game-and-player-management/economy
EconomyOverview -> game-and-player-management/economy#overview
EconomyAccounts -> game-and-player-management/economy#accounts
EconomyTransactions -> game-and-player-management/economy#transactions
EconomySettings -> game-and-player-management/economy#settings
EconomyShop -> game-and-player-management/economy#shop
EconomyRewardPackages -> game-and-player-management/economy#reward-packages
EconomyRedeemCodes -> game-and-player-management/economy#redeem-codes
GameItems -> game-and-player-management/game-items
ServerConfig -> integrations-and-access/server-configuration
Teleport -> game-and-player-management/teleport
TeleportTools -> game-and-player-management/teleport#tools
TeleportSettings -> game-and-player-management/teleport#settings
TeleportCities -> game-and-player-management/teleport#cities
TeleportHomes -> game-and-player-management/teleport#homes
TeleportLogs -> game-and-player-management/teleport#logs
GameNotice -> game-and-player-management/announcements-and-voting#game-notices
VoteRestart -> game-and-player-management/announcements-and-voting#vote-restart
VoteRestartSettings -> game-and-player-management/announcements-and-voting#vote-restart
VoteKick -> game-and-player-management/announcements-and-voting#vote-kick
VoteKickSettings -> game-and-player-management/announcements-and-voting#vote-kick
Achievement -> game-and-player-management/achievements-and-rewards
AchievementDefinitions -> game-and-player-management/achievements-and-rewards#achievement-definitions
AchievementRecords -> game-and-player-management/achievements-and-rewards#achievement-records
AchievementSettings -> game-and-player-management/achievements-and-rewards#achievement-settings
OnlineReward -> game-and-player-management/achievements-and-rewards#online-rewards
OnlineRewardSettings -> game-and-player-management/achievements-and-rewards#online-rewards
EventAutomation -> automation-and-reliability/event-automation
EventAutomationRules -> automation-and-reliability/event-automation#rules
EventAutomationRuns -> automation-and-reliability/event-automation#run-history
EventAutomationSettings -> automation-and-reliability/event-automation#settings
DiscordIntegration -> integrations-and-access/discord-integration
DiscordIntegrationSettings -> integrations-and-access/discord-integration#settings
GeoIpAccessControl -> integrations-and-access/geoip-access-control
GeoIpAccessControlSettings -> integrations-and-access/geoip-access-control#settings
PlayerTracking -> game-and-player-management/player-tracking
PlayerTrackingSettings -> game-and-player-management/player-tracking#settings
BanWhitelist -> integrations-and-access/access-control#ban-and-whitelist
Permission -> integrations-and-access/access-control#permissions
ModManagement -> integrations-and-access/mod-management
Console -> daily-operations/console-and-logs#console
Restart -> automation-and-reliability/restart
RestartSettings -> automation-and-reliability/restart#settings
RestartRun -> automation-and-reliability/restart#run-now
RestartHistory -> automation-and-reliability/restart#history
Scheduler -> automation-and-reliability/scheduler
SchedulerTasks -> automation-and-reliability/scheduler#tasks
SchedulerHistory -> automation-and-reliability/scheduler#history
SchedulerSettings -> automation-and-reliability/scheduler#settings
Backup -> automation-and-reliability/backup-and-recovery
BackupSettings -> automation-and-reliability/backup-and-recovery#settings
BackupTasks -> automation-and-reliability/backup-and-recovery#tasks
BackupHistory -> automation-and-reliability/backup-and-recovery#history
AuditLogs -> daily-operations/console-and-logs#audit-logs
GameEventLogs -> daily-operations/console-and-logs#game-event-logs
AppSettings -> integrations-and-access/application-settings
ApiDocumentation -> integrations-and-access/api-documentation
```

Write both links in every matrix row, using `/zh/` and `/en/` respectively. Mark Player Profile as a linked workflow entry even though its router meta is hidden.

- [x] **Step 3: Create the authoring template used by every paired operational page.**

Create `docs/superpowers/user-manual-page-template.md` with this exact structure, adapting heading language in each published page while retaining the same information order:

```markdown
---
outline: deep
---

# <Localized page title>

> <Availability, required role, and prerequisite summary.>

## Purpose

## Before you begin

## Procedure

## Verify the result

## Limits and safety notes

## Related pages
```

Require the `Procedure` section to use ordered steps, require the verification section to name an observable outcome, and use VitePress `warning`, `danger`, or `tip` containers for permission, destructive-action, privacy, and feature-availability cautions.

- [x] **Step 4: Create the screenshot manifest before opening the browser.**

Create `docs/superpowers/user-manual-screenshot-manifest.md` with columns `Feature`, `Chinese console route`, `English console route`, `Chinese asset`, `English asset`, `Caption focus`, `Test-data check`, and `Review`. Add these required feature rows:

```text
Player list and profile tracking
GPS map
Economy shop
Player item acquisition audit
Restart settings
Scheduler tasks
Backup settings and history
Event automation rule and run history
Discord diagnostics
GeoIP recent decisions
Permissions or ban-and-whitelist controls
```

Use frontend console routes beginning `/#/zh-cn/` and `/#/en/`. Record a separate Chinese and English asset path for every row. Do not mark a row complete until its capture uses test data and has no identifier, IP address, token, credential, Discord secret, or real server filesystem path.

- [x] **Step 5: Verify the controls are complete before authoring site pages.**

Run:

```powershell
rg -n "Dashboard|ApiDocumentation|PlayerProfile" docs\superpowers\user-manual-coverage.md
rg -n "Chinese asset|English asset|Test-data check" docs\superpowers\user-manual-screenshot-manifest.md
git diff --check -- docs\superpowers
```

Expected: coverage contains the first, hidden detail, and API link entries; the screenshot manifest has locale and data-safety columns; and Git reports no whitespace errors.

### Task 2: Build The Localized VitePress Shell

**Files:**
- Modify: `docs/vitepress/.vitepress/config.ts`
- Modify: `docs/vitepress/index.md`
- Delete: `docs/vitepress/markdown-examples.md`
- Delete: `docs/vitepress/api-examples.md`
- Create: `docs/vitepress/zh/index.md`
- Create: `docs/vitepress/en/index.md`

- [x] **Step 1: Keep a build baseline for the starter configuration.**

Run:

```powershell
pnpm docs:build
```

Expected: exit code `0` before replacing the starter content. This isolates later failures to the documentation changes.

- [x] **Step 2: Replace starter configuration with symmetric locale configuration.**

Set site title to `7 Days to Die ServerAdmin Manual`, description to `Operations manual for 7 Days to Die ServerAdmin`, and `lastUpdated: true`. Define VitePress site locales for `root`, `zh`, and `en`; link `zh` to `/zh/` and `en` to `/en/`. Configure the default theme with local search and these locale-specific theme sections:

```text
root: language-choice navigation only
zh: Chinese label, Chinese nav, Chinese sidebar, Chinese outline and last-updated labels
en: English label, English nav, English sidebar, English outline and last-updated labels
```

Both localized sidebars must contain these six ordered groups and only link to the paths in the file structure above:

```text
Getting started and lifecycle
Daily operations
Game and player management
Automation and reliability
Integrations and access
Reference and troubleshooting
```

Use localized group and page labels in each locale. Do not configure a production `base`, external edit link, custom theme, or version switcher.

> **Implementation note (2026-07-11):** The final configuration intentionally omits `locales.root`. Its generated `Language` menu entry navigated localized pages to an invalid root route. The neutral root `index.md` remains the language chooser, while the `zh` and `en` locale configurations provide the localized titles and navigation.

- [x] **Step 3: Replace starter home content with language entry points.**

Make `docs/vitepress/index.md` a short neutral language entry with exactly two prominent links: `/zh/` and `/en/`. Make each localized index a role-oriented manual overview linking to all six local documentation areas. Do not retain the starter home hero, examples navigation, or VitePress social link.

- [x] **Step 4: Remove the two starter example pages and stale navigation references.**

Delete `markdown-examples.md` and `api-examples.md`; remove all links to `/markdown-examples` and `/api-examples` from configuration and content.

- [x] **Step 5: Prove the localized shell builds before adding manual prose.**

Run:

```powershell
pnpm docs:build
pnpm docs:preview --host 127.0.0.1 --port 4173
```

Expected: the build exits `0`, and the preview reports a local URL. In Chrome, open `/`, `/zh/`, and `/en/`; verify the root language links and each locale's sidebar labels before stopping the preview server.

- [x] **Step 6: Commit the localized shell when commits are authorized.**

Run:

```powershell
git add docs/vitepress/.vitepress/config.ts docs/vitepress/index.md docs/vitepress/zh/index.md docs/vitepress/en/index.md docs/superpowers/user-manual-coverage.md docs/superpowers/user-manual-page-template.md docs/superpowers/user-manual-screenshot-manifest.md
git diff --cached --check
git commit -m "docs: scaffold bilingual user manual"
```

Stage `package.json` and `pnpm-lock.yaml` only after explicitly reviewing their user-owned VitePress bootstrap diff and deciding they belong in the same commit.

### Task 3: Author Paired Lifecycle And Daily-Operations Pages

**Files:**
- Create: `docs/vitepress/{zh,en}/getting-started/overview.md`
- Create: `docs/vitepress/{zh,en}/getting-started/installation.md`
- Create: `docs/vitepress/{zh,en}/getting-started/upgrade.md`
- Create: `docs/vitepress/{zh,en}/getting-started/initial-administrator-configuration.md`
- Create: `docs/vitepress/{zh,en}/getting-started/publishing.md`
- Create: `docs/vitepress/{zh,en}/daily-operations/dashboard.md`
- Create: `docs/vitepress/{zh,en}/daily-operations/players.md`
- Create: `docs/vitepress/{zh,en}/daily-operations/gps-map.md`
- Create: `docs/vitepress/{zh,en}/daily-operations/game-chat.md`
- Create: `docs/vitepress/{zh,en}/daily-operations/console-and-logs.md`
- Reference: `README.md`
- Reference: `LOCAL_FRONTEND_BACKEND_SYNC.md`
- Reference: `docs/local-validation.md`
- Reference: `docs/chrome-devtools-mcp-ui-checklist.md`

- [x] **Step 1: Author the paired overview, installation, and upgrade pages.**

The paired pages must explain the product boundary, frontend and backend roles, prerequisites, installation verification, upgrade preparation, backup before upgrade, restart, Swagger recovery, and post-upgrade checks. Use generic placeholders such as `<7DTD_SERVER_ROOT>` and `<SERVERADMIN_API_BASE_URL>`; never reproduce the local UNC path, private hostname, OAuth token, or default credential from the local runbook.

- [x] **Step 2: Author paired initial-administrator-configuration and publishing pages.**

The configuration page must cover first login, changing defaults, backend connectivity, feature-module availability, permissions, time zone awareness, and a first backup test. The publishing page must describe the verified order:

```text
publish backend -> restart 7DTD server -> wait for non-empty Swagger 200 -> run pnpm api:gen -> run pnpm typecheck and pnpm locale:check
```

Describe any destructive or environment-specific step as an operations warning. Use a placeholder backend destination and state that the publish profile must be reviewed for the target server before execution.

- [x] **Step 3: Author paired dashboard, players, and GPS map pages.**

`dashboard.md` explains monitoring cards, freshness, quick actions, and when to open the detailed workflow. `players.md` covers Player List and the hidden Player Profile flow, including identity selection, activity review, inventory and tracking tabs, and the distinction between player activity and audit logs. `gps-map.md` covers map layers, selecting a player or location, coordinates, and using GPS as a supporting navigation or investigation action rather than an exclusive management surface.

- [x] **Step 4: Author paired game-chat and console-and-logs pages.**

`game-chat.md` has separate `Live chat`, `Chat history`, `Chat settings`, and `Colored chat` sections. `console-and-logs.md` has `Console`, `Audit logs`, and `Game event logs` sections. Explain command authority, main-thread and side-effect cautions, search and filter workflow, and the difference between audit history and gameplay event history. Include player-facing commands only where an administrator must instruct or verify them.

- [x] **Step 5: Build and review bilingual parity for this batch.**

Run:

```powershell
pnpm docs:build
rg -n -i "Player Profile|Audit Logs|Game Event Logs" docs\vitepress\en\daily-operations
rg -n "玩家档案|审计日志|游戏事件日志" docs\vitepress\zh\daily-operations
```

Expected: the build exits `0`, and both language trees contain coverage for the hidden profile workflow and both log types. Update the matching coverage-matrix rows to `Complete` only after this check.

- [x] **Step 6: Commit the lifecycle and daily-operations batch when commits are authorized.**

Run:

```powershell
git add docs/vitepress/zh/getting-started docs/vitepress/en/getting-started docs/vitepress/zh/daily-operations docs/vitepress/en/daily-operations docs/superpowers/user-manual-coverage.md
git diff --cached --check
git commit -m "docs: add lifecycle and daily operations manual"
```

### Task 4: Author Paired Game-And-Player-Management Pages

**Files:**
- Create: `docs/vitepress/{zh,en}/game-and-player-management/feature-modules.md`
- Create: `docs/vitepress/{zh,en}/game-and-player-management/game-items.md`
- Create: `docs/vitepress/{zh,en}/game-and-player-management/economy.md`
- Create: `docs/vitepress/{zh,en}/game-and-player-management/teleport.md`
- Create: `docs/vitepress/{zh,en}/game-and-player-management/announcements-and-voting.md`
- Create: `docs/vitepress/{zh,en}/game-and-player-management/achievements-and-rewards.md`
- Create: `docs/vitepress/{zh,en}/game-and-player-management/player-tracking.md`
- Reference: `docs/player-tracking.md`
- Reference: `src/router/index.ts`

- [x] **Step 1: Document module state, game items, and economy as paired pages.**

`feature-modules.md` explains enablement, configuration health, runtime state, and dependency warnings. `game-items.md` explains safe lookup and grant verification without presenting a grant as a substitute for an audit trail. `economy.md` contains anchors for `Overview`, `Accounts`, `Transactions`, `Settings`, `Shop`, `Reward packages`, and `Redeem codes`; it explains global stock semantics, transaction review, reward-package references, and verification after each write operation.

- [x] **Step 2: Document the full teleport, notice, and voting workflow.**

`teleport.md` contains `Tools`, `Settings`, `Cities`, `Homes`, and `Logs` anchors. `announcements-and-voting.md` contains `Game notices`, `Vote restart`, and `Vote kick` anchors. For movement and vote actions, show required permission and cooldown checks, user-visible result, audit or history location, and how to undo or disable a configuration safely.

- [x] **Step 3: Document achievements and online rewards.**

`achievements-and-rewards.md` contains `Achievement definitions`, `Achievement records`, `Achievement settings`, and `Online rewards` anchors. Separate definition changes from player records and explain how to test a reward with a dedicated test account before enabling it for all players.

- [x] **Step 4: Document player tracking and item acquisition provenance.**

Use `docs/player-tracking.md` as the factual source. Include sections for sessions, activities, location samples, inventory snapshots, daily summaries, settings, retention, privacy, runtime state, and Player Profile integration. Explain that item acquisition records capture entity-loot-container and ground-pickup source events, including coordinates when available; they do not create a permanent identity for items after stack merging, transfers, crafting, or unsupported-mod flows. State that a missing record is an investigation lead, not proof of cheating.

- [x] **Step 5: Build and update coverage for every management route.**

Run:

```powershell
pnpm docs:build
rg -n "# (Overview|Accounts|Transactions|Settings|Shop|Reward Packages|Redeem Codes)" docs\vitepress\en\game-and-player-management\economy.md
rg -n "item acquisition|items obtained|source coordinates" docs\vitepress\en\game-and-player-management\player-tracking.md
```

Expected: all management pages build, the economy anchors exist, and the English tracking page explains source coordinates and the stack-merging limitation. Repeat the semantic check in the Chinese counterpart before marking the corresponding matrix rows `Complete`.

- [x] **Step 6: Commit the management batch when commits are authorized.**

Run:

```powershell
git add docs/vitepress/zh/game-and-player-management docs/vitepress/en/game-and-player-management docs/superpowers/user-manual-coverage.md
git diff --cached --check
git commit -m "docs: add game management manual"
```

### Task 5: Author Paired Automation-And-Reliability Pages

**Files:**
- Create: `docs/vitepress/{zh,en}/automation-and-reliability/restart.md`
- Create: `docs/vitepress/{zh,en}/automation-and-reliability/scheduler.md`
- Create: `docs/vitepress/{zh,en}/automation-and-reliability/event-automation.md`
- Create: `docs/vitepress/{zh,en}/automation-and-reliability/backup-and-recovery.md`
- Reference: `docs/event-automation-validation.md`
- Reference: `docs/local-validation.md`
- Reference: `7dtd-serveradmin-backend/src/LSTY.Sdtd.ServerAdmin/Features/Backup/Configuration/BackupFeatureSettings.cs`

- [x] **Step 1: Document restart scheduling, immediate runs, and history.**

`restart.md` contains `Settings`, `Run now`, and `History` anchors. Explain cron syntax, explicit time-zone selection, restart notice behavior, manual confirmation before a live restart, and history-based verification. Include the known distinction between a displayed next-run time and the actual configured server time zone; do not describe a client-local conversion as the authoritative schedule.

- [x] **Step 2: Document scheduler tasks, history, and settings.**

`scheduler.md` contains `Tasks`, `History`, and `Settings` anchors. Explain read-only versus mutating commands, allowed command boundaries, cron and time zone, task enablement, expected history results, and failure triage.

- [x] **Step 3: Document event automation with the current MVP boundary.**

`event-automation.md` contains `Rules`, `Run history`, and `Settings` anchors. Use `docs/event-automation-validation.md` to restrict documented rule triggers to `PlayerJoined`, `PlayerLeft`, `ChatMessage`, and `Cron`. Cover cooldown, first-join behavior, controlled failure tests, run-log diagnosis, audit-bound high-risk actions, and Discord failure alerts. Do not present death or kill events as available rule triggers.

- [x] **Step 4: Document backup configuration, task runs, history, and recovery.**

`backup-and-recovery.md` contains `Settings`, `Tasks`, and `History` anchors. Explain the world, database, and server-config subfeatures; their shared time zone; cron expressions; destination roots expressed with safe placeholders; compression; retention; save-world-before-backup; broadcast settings; and history retention. Provide a recovery runbook that requires stopping affected services, confirming the selected backup, restoring into the correct target, starting services, and verifying the intended state. Mark restoration as a high-risk operation and never put a real server path in examples.

- [x] **Step 5: Build and prove key reliability constraints are present.**

Run:

```powershell
pnpm docs:build
rg -n "PlayerJoined|PlayerLeft|ChatMessage|Cron" docs\vitepress\en\automation-and-reliability\event-automation.md
rg -n "world|database|server-config|time zone|retention" docs\vitepress\en\automation-and-reliability\backup-and-recovery.md
```

Expected: VitePress builds, event automation names only the four supported triggers, and backup documentation covers all three subfeatures plus shared time-zone and retention behavior. Repeat the semantic review in Chinese before marking its rows complete.

- [x] **Step 6: Commit the automation and reliability batch when commits are authorized.**

Run:

```powershell
git add docs/vitepress/zh/automation-and-reliability docs/vitepress/en/automation-and-reliability docs/superpowers/user-manual-coverage.md
git diff --cached --check
git commit -m "docs: add automation reliability manual"
```

### Task 6: Author Paired Integrations-And-Access Pages

**Files:**
- Create: `docs/vitepress/{zh,en}/integrations-and-access/server-configuration.md`
- Create: `docs/vitepress/{zh,en}/integrations-and-access/access-control.md`
- Create: `docs/vitepress/{zh,en}/integrations-and-access/mod-management.md`
- Create: `docs/vitepress/{zh,en}/integrations-and-access/discord-integration.md`
- Create: `docs/vitepress/{zh,en}/integrations-and-access/geoip-access-control.md`
- Create: `docs/vitepress/{zh,en}/integrations-and-access/application-settings.md`
- Create: `docs/vitepress/{zh,en}/integrations-and-access/api-documentation.md`
- Reference: `docs/discord-integration.md`
- Reference: `docs/geoip-access-control.md`

- [x] **Step 1: Document server configuration, access control, and mod management.**

`server-configuration.md` explains the configuration workflow, save and verification sequence, feature availability, and restart requirements. `access-control.md` contains `Ban and whitelist` and `Permissions` anchors; it explains scope, precedence, testing with a dedicated account, audit records, and safe reversal. `mod-management.md` explains inventory, version status, installation state, and the need to verify compatibility before acting.

- [x] **Step 2: Document Discord integration from the existing validated source.**

Use `docs/discord-integration.md`, but redact all sensitive values. Include minimal webhook and bot setup, channel separation, proxy diagnostics, slash commands, command whitelist, account binding, audit trail, live validation, and failure diagnosis. State that bot tokens and webhook URLs must never be put in screenshots, code blocks, or Vite browser environment variables.

- [x] **Step 3: Document GeoIP policy evaluation and live verification.**

Use `docs/geoip-access-control.md`. Include provider choices, cache behavior, the exact evaluation order, CIDR exceptions, private-IP and unknown-country policy, privacy implications of sending addresses to a provider, and a safe live test that verifies both block and recovery. State that GeoIP is coarse access control, not an identity or anti-cheat system.

- [x] **Step 4: Document application settings and the API documentation entry.**

`application-settings.md` explains application-wide settings, locale and session effects, safe save and verify steps, and when a frontend reload is needed. `api-documentation.md` explains the Swagger entry point, authenticated versus public access, reading request and response contracts, generating the frontend API client with `pnpm api:gen`, and using sanitized sample values. It links to the publishing page for the Swagger-recovery check.

- [x] **Step 5: Build and verify security-sensitive wording.**

Run:

```powershell
pnpm docs:build
rg -n -i "token|webhook|whitelist|audit" docs\vitepress\en\integrations-and-access\discord-integration.md
rg -n "Admin bypass|allow-list|block-list|UnknownCountryPolicy|PrivateIpPolicy" docs\vitepress\en\integrations-and-access\geoip-access-control.md
```

Expected: build succeeds, Discord documentation has explicit secret-handling and audit guidance, and GeoIP documentation names all policy precedence controls. Apply the same parity review to Chinese files.

- [x] **Step 6: Commit the integration batch when commits are authorized.**

Run:

```powershell
git add docs/vitepress/zh/integrations-and-access docs/vitepress/en/integrations-and-access docs/superpowers/user-manual-coverage.md
git diff --cached --check
git commit -m "docs: add operations integration manual"
```

### Task 7: Author Reference Pages And The Published Menu Index

**Files:**
- Create: `docs/vitepress/{zh,en}/reference/console-menu-index.md`
- Create: `docs/vitepress/{zh,en}/reference/administrator-commands.md`
- Create: `docs/vitepress/{zh,en}/reference/troubleshooting.md`
- Create: `docs/vitepress/{zh,en}/reference/terminology.md`
- Modify: `docs/superpowers/user-manual-coverage.md`
- Reference: `docs/local-validation.md`
- Reference: `docs/chrome-devtools-mcp-ui-checklist.md`

- [x] **Step 1: Generate the published menu index from the coverage matrix.**

Create one localized table per language with console menu label, child label when present, manual link, and a concise purpose. Every matrix route must have a published link. Parent routes that redirect to a default child must map to the parent workflow page; child routes map to the documented anchor. Include Player Profile as a linked Player List workflow even though it is hidden from the sidebar.

- [x] **Step 2: Author the administrator-relevant command and terminology references.**

`administrator-commands.md` covers only commands that affect an administrator workflow: scope, permission, confirmation, expected output, audit location, and whether a command may alter state. `terminology.md` defines server, backend, frontend, feature module, runtime state, audit log, game event log, cron, time zone, retention, snapshot, acquisition record, loot container, and recovery. Do not turn either page into a separate player command guide.

- [x] **Step 3: Author the paired troubleshooting decision flow.**

`troubleshooting.md` begins with reachability, authentication, feature module state, permission, configuration, history or audit evidence, and live-server verification. Include exact branches for restart timing, scheduler failure, backup failure, Discord connection, GeoIP lookup, event automation run failure, player tracking data gaps, and Swagger or API-client mismatch. Each branch ends with a verification result or a clearly identified escalation boundary.

- [x] **Step 4: Check publication and coverage parity.**

Run:

```powershell
pnpm docs:build
rg -n "ApiDocumentation|PlayerProfile|BackupHistory|DiscordIntegrationSettings" docs\superpowers\user-manual-coverage.md
rg -n "API Documentation|Player Profile|Backup History|Discord" docs\vitepress\en\reference\console-menu-index.md
```

Expected: build succeeds, the coverage matrix has all sampled route names, and the published English index links those workflows. Review the Chinese index for the matching localized entries, then mark every reviewed matrix row `Complete`.

- [x] **Step 5: Commit the reference and menu-index batch when commits are authorized.**

Run:

```powershell
git add docs/vitepress/zh/reference docs/vitepress/en/reference docs/superpowers/user-manual-coverage.md
git diff --cached --check
git commit -m "docs: add manual reference and menu index"
```

### Task 8: Capture Localized Screenshots With Chrome DevTools MCP

**Files:**
- Create: locale-specific assets under `docs/vitepress/public/images/zh/`
- Create: locale-specific assets under `docs/vitepress/public/images/en/`
- Modify: the paired manual pages that embed the screenshots
- Modify: `docs/superpowers/user-manual-screenshot-manifest.md`
- Modify: `docs/superpowers/user-manual-coverage.md`
- Reference: `docs/chrome-devtools-mcp-ui-checklist.md`

- [x] **Step 1: Establish a sanitized capture environment.**

Start the frontend and a test-capable backend with a dedicated test account. Confirm no real player IDs, public IP addresses, tokens, passwords, webhook URLs, Discord channel IDs, or server filesystem paths are visible. Use the frontend console's existing locale routes:

```text
Chinese: /#/zh-cn/<route>
English: /#/en/<route>
```

If a safe test environment is unavailable, do not replace screenshots with real production captures. Complete the text pages, leave only the affected manifest rows incomplete, and request a sanitized environment before declaring the manual complete.

- [x] **Step 2: Capture Chinese high-risk workflow evidence.**

Use Chrome DevTools MCP to capture the Chinese interface for every manifest row. Name assets by feature, for example:

```text
images/zh/daily-operations/player-list.png
images/zh/daily-operations/gps-map.png
images/zh/game-and-player-management/economy-shop.png
images/zh/game-and-player-management/player-acquisition-audit.png
images/zh/automation-and-reliability/restart-settings.png
images/zh/automation-and-reliability/scheduler-tasks.png
images/zh/automation-and-reliability/backup-history.png
images/zh/automation-and-reliability/event-automation-run-history.png
images/zh/integrations-and-access/discord-diagnostics.png
images/zh/integrations-and-access/geoip-recent-decisions.png
images/zh/integrations-and-access/access-control.png
```

Record viewport, console result, network result, tested route, and test-data check in the manifest.

- [x] **Step 3: Capture the matching English workflow evidence.**

Repeat the same routes with `/en/` in the console and store matching English assets under `images/en/` with the same relative feature names. Confirm visible UI text is English. Do not derive an English image by reusing or relabeling a Chinese capture.

- [x] **Step 4: Embed images with localized alt text and captions.**

Embed an image only in the page and step it proves. Use concise localized alt text that identifies the control or result, plus a caption describing what the operator should notice. Update manifest rows and matching coverage rows only after the image renders in the built site.

- [x] **Step 5: Review images in the built documentation site.**

Run:

```powershell
pnpm docs:build
pnpm docs:preview --host 127.0.0.1 --port 4173
```

Expected: all assets resolve in the static output. In Chrome, open a Chinese and English page for every screenshot feature; verify the image is readable, fits the page, has the correct language, and contains no sensitive data.

> **Verification note (2026-07-11):** `vitepress preview` in the installed `2.0.0-alpha.18` returned `404` for existing `assets/app.*.js` and `assets/chunks/theme.*.js` files. The generated `.vitepress/dist/` directory was therefore checked with a plain static HTTP server, which served those assets with `200`; Chrome DevTools MCP then passed all 22 image pages in both locales.

- [x] **Step 6: Commit screenshot assets separately when commits are authorized.**

Run:

```powershell
git add docs/vitepress/public/images docs/vitepress/zh docs/vitepress/en docs/superpowers/user-manual-screenshot-manifest.md docs/superpowers/user-manual-coverage.md
git diff --cached --check
git commit -m "docs: add localized manual screenshots"
```

### Task 9: Final Documentation Verification And Handoff

**Files:**
- Verify: `docs/vitepress/.vitepress/config.ts`
- Verify: `docs/vitepress/index.md`
- Verify: `docs/vitepress/zh/`
- Verify: `docs/vitepress/en/`
- Verify: `docs/superpowers/user-manual-coverage.md`
- Verify: `docs/superpowers/user-manual-screenshot-manifest.md`

- [x] **Step 1: Check that both language trees have identical relative paths.**

Run:

```powershell
$zh = Get-ChildItem docs\vitepress\zh -File -Recurse | ForEach-Object { $_.FullName.Replace((Resolve-Path docs\vitepress\zh).Path, '') }
$en = Get-ChildItem docs\vitepress\en -File -Recurse | ForEach-Object { $_.FullName.Replace((Resolve-Path docs\vitepress\en).Path, '') }
Compare-Object $zh $en
```

Expected: no output. Any path reported by `Compare-Object` must be added to the other locale or intentionally removed from both locales before release.

- [x] **Step 2: Check for starter residue, unresolved markers, and unsafe values.**

Run:

```powershell
$forbiddenMarkers = @('TO' + 'DO', 'TB' + 'D', 'FIX' + 'ME')
rg -n -i ("markdown examples|runtime api examples|{0}" -f ($forbiddenMarkers -join '|')) docs\vitepress
rg -n -i "password=|bearer [a-z0-9]|discord\.com/api/webhooks|172\.16\.168\.25|7dtdserver\.local" docs\vitepress
```

Expected: no output. Replace any accidental starter label, unresolved marker, or private value with final manual content or a safe placeholder before proceeding.

- [x] **Step 3: Build the complete static artifact.**

Run:

```powershell
pnpm docs:build
```

Expected: exit code `0` and a generated VitePress static output under `docs/vitepress/.vitepress/dist/`.

- [x] **Step 4: Perform browser acceptance checks with Chrome DevTools MCP.**

Run the preview server:

```powershell
pnpm docs:preview --host 127.0.0.1 --port 4173
```

Inspect `/`, `/zh/`, and `/en/`; then sample at least one page from each of the six areas in each language. Verify language switching, sidebars, local search, headings, internal links, warning containers, screenshot rendering, no console errors, and no horizontal overlap at desktop and narrow viewport widths.

> **Verification note (2026-07-11):** When the VitePress alpha preview server misrouted existing JavaScript assets, the same built directory was served through a plain static HTTP server for acceptance. The root, `/zh/`, `/en/`, all six areas in each locale, all 22 screenshot pages, and `375px` mobile samples passed without console errors or horizontal overflow.

- [x] **Step 5: Run the final coverage review.**

Confirm every row in `user-manual-coverage.md` has non-empty Chinese and English links and `Review` equals `Complete`. Confirm every screenshot-manifest row either has both localized assets and `Review` equals `Complete`, or has a recorded sanitized-environment blocker; do not claim full screenshot completion while a blocker remains.

- [x] **Step 6: Make the final documentation commit when commits are authorized.**

Run:

```powershell
git status --short
git add docs/vitepress docs/superpowers/user-manual-coverage.md docs/superpowers/user-manual-page-template.md docs/superpowers/user-manual-screenshot-manifest.md
git diff --cached --check
git commit -m "docs: publish bilingual server admin manual"
git show --stat --oneline --summary HEAD
git status --short
```

Expected: the commit contains only intended documentation files. Preserve any unrelated user-owned files shown by the final status output.

## Plan Self-Review

- **Spec coverage:** Tasks 1 through 9 implement the symmetric language roots, all 67 current non-authentication workflow routes from `src/router/index.ts`, lifecycle material, publishing, backup and recovery, troubleshooting, localized screenshots, static build, and browser verification required by the approved design.
- **No historical-version expansion:** no task introduces a version switcher, versioned directory, custom theme, CMS, deployment host, or separate player guide.
- **Source discipline:** route coverage comes from `src/router/index.ts`; Player Tracking, Discord, GeoIP, event automation, validation, and publishing guidance use the existing project documents and runbook rather than invented operational claims.
- **Safety:** all public examples use sanitized placeholders; the screenshot task blocks real-data capture; the final scan rejects known local private values and credential-shaped values.
- **Verification:** every content batch runs `pnpm docs:build`; final checks include locale path parity, coverage completion, static preview, and Chrome DevTools MCP inspection.
