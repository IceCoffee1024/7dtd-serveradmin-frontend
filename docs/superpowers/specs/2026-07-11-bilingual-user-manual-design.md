# Bilingual VitePress User Manual Design

**Date:** 2026-07-11
**Status:** Approved design, awaiting written-spec review

## Goal

Create the first complete user manual for the current `main` functionality of
7 Days to Die ServerAdmin. The manual serves server owners, administrators, and
operations staff. It is a bilingual VitePress site with Chinese and English
content that have equal coverage, workflow depth, cautions, and visual evidence.

Player-facing game operations and commands are included only when an
administrator needs them to configure, support, verify, or investigate a server
workflow. The site is not a separate player guide.

## Scope And Boundaries

- Cover every currently visible console menu and visible child page, including
  low-frequency features, settings, histories, diagnostics, and the API
  documentation entry point.
- Cover installation, upgrades, initial administrator configuration, frontend
  and backend publishing, backup and recovery, and troubleshooting.
- Document the functionality currently represented by `main` only. Do not add
  historical manuals or version switching in the first edition.
- Build a static artifact in this repository only. Do not assume a production
  hostname, deployment path, or external documentation site.
- Do not introduce a CMS, a custom VitePress theme, a separate player manual,
  or live production data in the first edition.

## Site Architecture

The site root is a lightweight language entry point. Neither language is the
default documentation route:

```text
docs/vitepress/
  .vitepress/
    config.ts
  index.md
  zh/
    index.md
    getting-started/
    daily-operations/
    game-and-player-management/
    automation-and-reliability/
    integrations-and-access/
    reference/
  en/
    index.md
    getting-started/
    daily-operations/
    game-and-player-management/
    automation-and-reliability/
    integrations-and-access/
    reference/
  public/
    images/
      zh/
      en/
```

- `/zh/` contains the Chinese manual.
- `/en/` contains the English manual.
- The two language trees use matching paths and matching navigation structure.
- `index.md` offers language selection only; it does not make either language
  the primary manual path.
- The VitePress default theme remains in use. Configuration provides locale
  labels, language switching, per-language navigation and sidebars, local
  search, and last-updated metadata. It does not configure a production `base`,
  version switching, an external edit link, or a custom theme.

## Information Architecture

Each language has the following six documentation areas:

1. **Getting started and lifecycle**: overview, installation, upgrades, initial
   administrator configuration, frontend and backend publishing.
2. **Daily operations**: dashboard, players, player detail, GPS map, game chat,
   console, audit logs, and game event logs.
3. **Game and player management**: feature modules, game items, economy,
   teleport, notices, voting, achievements, online rewards, player tracking,
   and related configuration.
4. **Automation and reliability**: restart, scheduler, event automation,
   backup configuration, backup execution, recovery, and histories.
5. **Integrations and access**: server configuration, permissions, bans and
   whitelist, mod management, Discord, GeoIP access control, application
   settings, and the API documentation entry point.
6. **Reference and troubleshooting**: console-menu index, administrator-relevant
   in-game operations and commands, terminology, configuration notes, known
   failure signals, and troubleshooting workflows.

Navigation follows operator workflows rather than copying the console menu
verbatim. A published console-menu index maps each console entry to its manual
page so that the workflow-oriented navigation does not hide or omit a feature.

## Console Coverage Baseline

The implementation must derive the coverage matrix from
`src/router/index.ts`, which is the current menu-route source. The matrix is a
maintainer artifact under `docs/superpowers/` with these columns: route name and
path, Chinese page, English page, documentation status, screenshot required,
and review status.

The published menu index and the maintainer matrix must cover the following
current route groups:

- Dashboard; Player List and Player Profile; GPS Map; Feature Modules.
- Game Chat: Live Chat, Chat History, Chat Settings, and Colored Chat.
- Economy: Overview, Accounts, Transactions, Settings, Shop, Reward Packages,
  and Redeem Codes.
- Game Items and Server Configuration.
- Teleport: Tools, Settings, Cities, Homes, and Logs.
- Game Notice; Vote Restart Settings; Vote Kick Settings.
- Achievement: Definitions, Records, and Settings; Online Reward Settings.
- Event Automation: Rules, Runs, and Settings.
- Discord Integration Settings; GeoIP Access Control Settings; Player Tracking
  Settings.
- Ban and Whitelist; Permission; Mod Management; Console.
- Restart: Settings, Run, and History.
- Scheduler: Tasks, History, and Settings.
- Backup: Settings, Tasks, and History.
- Audit Logs; Game Event Logs; Application Settings; API Documentation.

Player Profile is not a visible top-level menu entry, but it is part of the
player administration workflow and must be documented through the Player List
pages and their linked detail flow.

## Page Contract

Every operational page follows the same reader-facing contract:

1. Applicability, required role, prerequisites, and feature availability.
2. Purpose and the operator outcome.
3. Fields, actions, commands, or API inputs that matter to the workflow.
4. Ordered procedure with expected results.
5. Verification steps and observable success signals.
6. Risks, irreversible effects, version constraints, permission constraints, or
   disabled-module behavior.
7. Related pages and recovery or troubleshooting links where relevant.

Pages must state when a feature depends on an enabled module, an administrator
permission, a backend capability, or a particular server configuration. They
must not imply that a setting is available or safe on every installation.

Existing topic documents are source material, not a second public manual. Their
contents are reviewed and incorporated into the VitePress site; a legacy page
is retained only when it is engineering-specific or points readers to the
canonical VitePress page.

## Localization Rules

- Chinese and English pages are maintained as paired, independently localized
  content, not as an automatic translation pipeline.
- The paired pages preserve the same information architecture, workflows,
  warnings, version applicability, and verification criteria.
- Commands, configuration keys, API fields, and code blocks remain identical
  across languages. Explanatory text, cautions, captions, and screenshots are
  localized separately.
- Examples use explicit sanitized placeholders for addresses, tokens, player
  identifiers, and filesystem paths. No real credentials or identifiable server
  data appears in a document.

## Screenshot Strategy

Screenshots are evidence for workflows that are difficult or risky to infer
from text alone: complex forms, map targeting, player-tracking results, restart
or backup settings, permission configuration, integration configuration, and
meaningful error states. Simple reference pages use text, tables, and sanitized
examples instead of decorative images.

- Capture screenshots with Chrome DevTools MCP from a local test environment.
- Capture Chinese UI for Chinese pages and English UI for English pages; never
  reuse a visibly localized image across languages.
- Store assets by locale and feature, for example
  `public/images/zh/restart/` and `public/images/en/restart/`.
- Use stable desktop viewports, dedicated test accounts, and sanitized test
  data. Check the active locale and absence of sensitive data before capture.
- Do not photograph real data and rely on later obscuring. Do not expose player
  identifiers, IP addresses, tokens, passwords, Discord credentials, or server
  filesystem paths.
- Every screenshot has useful alternative text and a concise caption that says
  what the operator should notice.

## Quality Gates And Maintenance

Documentation changes pass only when all of the following are true:

1. `pnpm docs:build` succeeds, proving that the VitePress configuration,
   Markdown, and referenced static assets compile into a static site.
2. A local browser preview verifies the root language entry, `/zh/`, `/en/`,
   language switching, navigation, local search, and representative pages in
   every documentation area.
3. The coverage matrix proves that every route in the console coverage baseline
   has a Chinese and English documentation destination.
4. Chrome DevTools MCP visually checks representative high-risk workflows and
   every newly introduced screenshot for locale correctness, readability, and
   sensitive-data safety.
5. No VitePress starter content remains in the published navigation or pages.

When the product changes, the same change updates both language pages, the menu
index, the coverage matrix, and affected screenshots. A changed UI or a changed
behavior is not considered documented until these artifacts agree.

## Error Handling Expectations

The manual distinguishes actionable product errors from missing prerequisites.
For example, it explains whether a problem is caused by a disabled module,
insufficient permission, unavailable backend endpoint, failed scheduled job,
or failed backup. Recovery instructions lead to a verification result rather
than ending at a generic retry instruction.

## Acceptance Criteria

The first edition is complete when it is a buildable static VitePress site with
the two symmetrical language trees; every current console menu path has a
mapped Chinese and English manual destination; lifecycle, publishing, backup,
recovery, and troubleshooting content are present; required screenshots are
localized and sanitized; and the quality gates above have passed.
