# Release ZIP Owner Documentation Design

**Date:** 2026-07-12

**Status:** Approved design, awaiting written-spec review
**Extends:** `2026-07-11-bilingual-user-manual-design.md`

## Goal

Make the GitHub Release ZIP the primary installation and upgrade path for 7
Days to Die server owners and administrators. A normal installation must not
require readers to understand the frontend repository, Node.js, pnpm, `.env`,
Swagger, API generation, or reverse-proxy deployment.

Keep source build and publication guidance available for maintainers, but make
its specialist audience unambiguous in both languages. Add one reusable,
bilingual GitHub Release body template so release announcements state the
information that an owner needs to install, upgrade, verify, secure, and report
problems safely.

## Evidence And Product Contract

The current `ServerAdmin.v0.33.zip` beta asset has a single top-level
`ServerAdmin/` directory. It contains the backend assemblies, `ModInfo.xml`,
`wwwroot/index.html`, and `Config/appsettings.Default.json`. Extracting that
archive directly into `<7DTD_SERVER_ROOT>/Mods/` therefore produces the expected
path:

```text
<7DTD_SERVER_ROOT>/
  Mods/
    ServerAdmin/
      ModInfo.xml
      wwwroot/
      Config/
```

The backend serves static files from `ServerAdmin/wwwroot`, so a Release ZIP
contains the frontend and backend required by an owner. No standalone frontend
host, browser environment variable, or generated API client is part of the
owner installation contract.

Configuration has two layers:

1. The shipped `Config/appsettings.Default.json` provides defaults.
2. The mod creates and reloads `Config/appsettings.json`, which overrides those
   defaults and holds operator-managed settings.

The default SQLite location is under `Mods/ServerAdmin/Config/`. These mutable
files are operational data, not files to discard during an upgrade.

The current beta configuration listens on port `8088` on all interfaces. The
documentation must treat that as an implementation detail subject to the
release's configuration, not as a reason to expose the service directly to the
public internet.

## Scope

### In scope

- Replace the public Chinese and English **Installation** pages with a
  Release-ZIP owner workflow.
- Replace the public Chinese and English **Upgrade** pages with a Release-ZIP
  owner workflow and an explicit rollback boundary.
- Update paired overview and initial-administrator pages where they currently
  assume source deployment, Swagger, or frontend publication as a prerequisite.
- Retain the paired publishing pages, rename and position them as an advanced
  source-build and maintainer workflow, and preserve their existing API-client
  compatibility guidance.
- Update VitePress sidebar labels so source publishing cannot be mistaken for
  the normal installation route.
- Add a reusable bilingual Release body authoring template at
  `docs/superpowers/release-templates/github-release-body.md` in the frontend
  repository.
- Update user-manual conventions, coverage records, and the existing
  implementation plan status to reflect the new lifecycle documentation
  contract.

### Out of scope

- Changing the backend's default credentials, port, authentication mechanism,
  packaging scripts, CI/CD, or GitHub Release assets.
- Promising a dependency such as `0_TFP_Harmony` without a verified release
  prerequisite and game-version compatibility statement.
- Publishing a production documentation site, creating a release automation
  workflow, or changing any game/admin-console feature behavior.
- Rewriting operational feature pages or recapturing screenshots that are not
  affected by this lifecycle-documentation change.

## Audience And Information Architecture

The existing two lifecycle routes remain stable, but their meaning changes for
the primary audience:

| Route | Chinese title | English title | Intended reader |
| --- | --- | --- | --- |
| `getting-started/installation` | 从 Release ZIP 安装 | Install from a Release ZIP | Server owner or administrator |
| `getting-started/upgrade` | 通过 Release ZIP 升级 | Upgrade with a Release ZIP | Server owner or administrator |
| `getting-started/publishing` | 高级：从源码构建与发布 | Advanced: build and publish from source | Maintainer or deployment engineer |

`overview` introduces the Release ZIP as the normal product boundary: one
ServerAdmin mod directory contains the backend and web console. It links to the
advanced publishing page only for source-build or API-change work.

`initial-administrator-configuration` starts after the owner has opened the
packaged web console. It retains credential rotation, least privilege, time
zone, and backup-baseline guidance, but it does not require a reader to check
Swagger or configure frontend hosting before first login.

The sidebar keeps these pages in the lifecycle section. The advanced publishing
page remains last and receives an explicit advanced label in each locale; no
navigation route changes, so existing links continue to work.

## Owner Installation Workflow

Both localized installation pages use the established page contract and contain
the same operations in localized language:

1. Check the Release notes for the exact recommended archive, supported game
   version, operating-system notes, prerequisites, checksum, and known issues.
2. Stop the dedicated server if it is running. Download and, when a checksum is
   published, verify the named `ServerAdmin.v<version>.zip` archive.
3. Extract the archive into `<7DTD_SERVER_ROOT>/Mods/`. Show the intended folder
   tree and a short warning that `Mods/ServerAdmin/ServerAdmin/` is incorrect.
4. Start the dedicated server normally and wait for the mod to load. Open the
   web console on the server host's configured URL. `localhost` applies only
   when the browser runs on the same host.
5. Sign in with the initial credentials supplied by the release, immediately
   change them, and verify Dashboard or a simple read-only page.

The pages state that the release's prerequisites section, rather than a
hard-coded undocumented dependency, is authoritative. For remote access they
require firewall or reverse-proxy review and warn against exposing a default
credential on a public port.

The pages do not mention `pnpm`, `.env`, `VITE_*`, Swagger, `api:gen`, static
hosting, CORS, or reverse proxy configuration as required installation steps.
They may link to the advanced page for readers intentionally building from
source.

## Owner Upgrade And Rollback Workflow

The paired upgrade pages establish an explicit, conservative package update
contract:

1. Schedule maintenance, stop the dedicated server, and retain the current
   Release ZIP or extracted program directory as a rollback candidate.
2. Back up `ServerAdmin/Config/appsettings.json`, the ServerAdmin database, and
   relevant game-server configuration/world data before replacing files.
3. Extract the new Release ZIP into `<7DTD_SERVER_ROOT>/Mods/`, replacing the
   shipped assemblies, dependencies, `wwwroot`, and
   `Config/appsettings.Default.json` while preserving the mutable configuration
   and database.
4. Start the server, check the mod load result and admin-console reachability,
   then perform a read-only dashboard or player-list verification.
5. If startup, authentication, or a data migration fails, stop the server and
   restore the matching previous program directory **and** the pre-upgrade
   configuration/database backup. A binary-only rollback is not represented as
   safe after a database migration.

The pages must explain the default-versus-override configuration relationship:
replace `appsettings.Default.json` with the release version; do not overwrite or
delete `appsettings.json` without a backup. They must also explain that a
release cannot automatically prove that custom configuration keys remain valid;
the Release notes must call out required manual configuration changes.

## Release Body Template

The GitHub Release repository (`IceCoffee1024/7DaysToDie-ServerAdmin`) is not
one of the two repositories in this workspace. Therefore this change creates a
source-controlled authoring template at
`docs/superpowers/release-templates/github-release-body.md`; it does not imply
that a file in the frontend repository is automatically used by the external
Release repository.

The template is manually copied into the GitHub Release body, or later copied
to the release repository and used with `gh release create --notes-file`. Its
opening comment makes that boundary explicit.

The template contains an English section followed by a Chinese section with
equivalent headings. It requires these fields before publication:

1. Release status, version, exact recommended ZIP asset, publication date, and
   Beta/production suitability.
2. 7 Days to Die version compatibility, platform notes, required prerequisites,
   and known incompatibilities.
3. SHA-256 checksum for each recommended asset.
4. Concise install flow using `Mods/ServerAdmin/`, a no-nested-folder warning,
   configured console URL, and initial-credential rotation requirement.
5. Concise upgrade, backup, configuration/database preservation, and rollback
   guidance.
6. Security guidance for remote access and a prohibition on publishing live
   credentials, tokens, private paths, IP addresses, or server identifiers.
7. Feature/module summary, notable changes, known issues, and a feedback
   request that asks for reproduction steps, sanitized logs, and screenshots.

It uses placeholders such as `<VERSION>`, `<ASSET_NAME>`,
`<SHA256>`, `<SUPPORTED_7DTD_VERSION>`, `<INITIAL_USERNAME>`, and
`<INITIAL_PASSWORD>`. It must never bake the current public default credentials
into the template; this permits a future secure installation mechanism without
rewriting the documentation structure.

## Localization And Content Rules

- Installation, upgrade, overview, initial-configuration, and publishing pages
  remain path-symmetric between `/zh/` and `/en/`.
- Commands, paths, configuration filenames, placeholders, and archive names
  remain exactly identical between languages. Explanatory text and warnings are
  independently localized.
- Examples use `<7DTD_SERVER_ROOT>`, `<SERVER_HOST>`, `<PORT>`, and redacted
  credential placeholders. No actual deployment host, player identity, token,
  private path, or password appears in the manual.
- The installation folder tree is a text diagram. New screenshots are not
  required because the workflow is primarily file placement; no existing
  localized screenshots are removed or reused.

## Error Handling And Recovery Guidance

The owner pages must map likely failures to observable checks:

| Failure signal | Documented response |
| --- | --- |
| `Mods/ServerAdmin/ServerAdmin/` exists | Move the inner `ServerAdmin` directory so `ModInfo.xml` is directly under `Mods/ServerAdmin/`. |
| The mod does not load | Check the Release compatibility/prerequisites and the dedicated-server log; do not install frontend source tooling as a workaround. |
| The console cannot open | Check server startup, configured port, host/firewall access, and whether the browser is local or remote. |
| Initial login fails | Verify the release-provided initial configuration, avoid exposing credentials, and inspect the generated override configuration before resetting it. |
| Upgrade fails or migration errors occur | Stop the server and restore the matching prior package together with the pre-upgrade configuration/database backup. |

## Verification And Acceptance Criteria

The implementation is accepted only when all conditions hold:

1. Both language installation and upgrade pages describe Release ZIP workflows
   without requiring source tooling or frontend deployment knowledge.
2. Both language overview and initial-configuration pages direct the normal
   reader through the Release ZIP path; the advanced publishing page remains
   available but clearly scoped to maintainers.
3. VitePress navigation labels make the advanced page distinguishable in both
   locales and all existing internal links resolve.
4. The source-controlled release-body template contains both localized sections
   and every required release field, with no real secrets or deployment data.
5. The coverage matrix and implementation-plan status describe the amended
   lifecycle documentation work accurately.
6. `pnpm docs:build` succeeds; a static preview confirms the Chinese and
   English installation, upgrade, overview, initial-configuration, and advanced
   publishing pages, including sidebar navigation and language switching.
7. A source scan confirms no owner installation/upgrade page contains required
   `pnpm`, `VITE_*`, Swagger, `api:gen`, or frontend-hosting instructions.

## Implementation Sequence

1. Create a detailed follow-up plan after this specification receives written
   review.
2. Add the reusable release template and amend the documentation conventions.
3. Rewrite paired lifecycle pages and clarify the sidebar labels.
4. Update coverage/plan status, run static build and browser acceptance checks,
   then commit the docs-only change in the frontend repository.

## Spec Self-Review

- No placeholder marks an undecided behavior; angle-bracket strings above are
  intentional release-template placeholders.
- The design does not claim unverified dependencies or introduce a release
  automation system.
- The mutable configuration and database preservation rules align with the
  current layered configuration behavior.
- The scope is one documentation/release-communication follow-up and does not
  duplicate the completed console-feature manual work.
