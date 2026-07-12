# User Manual Conventions

## Audience And Scope

- The first edition serves server owners, administrators, and operations staff.
- Player-facing in-game operations and commands are documented only where they affect an administrator workflow. This site is not a separate player guide.
- Cover every currently visible console menu and its visible child pages in the first edition, including low-frequency modules, settings, histories, diagnostics, and the API documentation entry point.
- Cover installation, upgrades, initial administrator configuration, frontend and backend publishing, backup and recovery, and troubleshooting in the first edition.
- Treat a verified GitHub Release ZIP as the normal installation and upgrade path for server owners. Source builds, frontend environment variables, API generation, Swagger, and static hosting belong only in clearly labeled maintainer guidance.

## Languages

- Publish equivalent Chinese and English user-manual content.
- Keep the information architecture, workflow coverage, cautions, and version applicability aligned across both languages.
- Document the current `main` functionality only in the first edition. Do not add historical-version manuals or version switching.

## Delivery

- Build the first edition as a static documentation artifact in this repository only. Do not assume a production hostname, deployment path, or external documentation site.
- Use symmetric language roots: `/zh/` for Chinese and `/en/` for English. Keep the site root as a lightweight language entry point rather than making either language the default path.

## Content Standards

- Structure each operational page around applicability and prerequisites, purpose, steps, verification, cautions, and related pages.
- Organize navigation around administrator workflows, then provide a console-menu index that maps every visible menu and child page to its documentation.
- Maintain Chinese and English pages as paired, independently localized content. Keep commands, configuration keys, API fields, and code blocks unchanged between languages.
- Use sanitized placeholders for server addresses, tokens, player identifiers, and filesystem paths in examples.
- Installation and upgrade pages must show the expected `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/ModInfo.xml` placement and warn against a nested `Mods/ServerAdmin/ServerAdmin/` directory.
- When the product has shipped defaults plus a writable override, document the upgrade rule explicitly: replace released defaults, but back up and preserve mutable configuration and database files.

## Screenshots

- Capture screenshots with Chrome DevTools MCP when a workflow benefits from visual confirmation.
- Capture each localized screenshot separately: Chinese documentation uses the Chinese interface, and English documentation uses the English interface.
- Do not reuse a Chinese UI screenshot in the English manual or an English UI screenshot in the Chinese manual when visible UI text is part of the instruction.
- Use dedicated test data or sanitized data only. Screenshots must not expose real player identifiers, IP addresses, tokens, passwords, Discord credentials, or server filesystem paths.
- Store screenshot assets by language and feature, and use them only where they materially clarify a workflow or prevent a likely operator error.
- Verify the locale and absence of sensitive data before capture; do not rely on obscuring a real screenshot afterward.

## Validation

- Require a successful `pnpm docs:build`, local browser checks for both language roots and navigation, and a coverage matrix that maps every visible console route to both languages.
- Use Chrome DevTools MCP to review representative high-risk workflows and every new screenshot for readability, locale correctness, and sensitive-data safety.
- When product behavior or UI changes, update both language pages, the menu index, the coverage matrix, and affected screenshots together.
- Validate that release communication names one recommended asset, compatibility, verified prerequisites, checksum, security/initial-login guidance, upgrade preservation rules, rollback boundary, known issues, and a sanitized support report format.
