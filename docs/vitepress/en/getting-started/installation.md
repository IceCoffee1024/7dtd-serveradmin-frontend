---
outline: deep
---

# Install from a Release ZIP

> For a 7 Days to Die dedicated-server owner or administrator. Requires a Release asset compatible with the server, filesystem access to `<7DTD_SERVER_ROOT>/Mods/`, and an approved initial administrator account.

## Purpose

Install the packaged ServerAdmin backend and web console together as one mod; no frontend repository or source build is required.

## Before you begin

- Read the selected Release's compatibility, prerequisites, known issues, recommended asset name, and SHA-256 value when one is published.
- Back up an existing `Mods/ServerAdmin/` directory before replacing it.
- Decide whether the browser runs on the server host or a permitted remote network; do not expose initial credentials on a public port.

## Procedure

1. Stop the dedicated server if it is running and download the exact `ServerAdmin.v<version>.zip` asset named by the Release.
2. Verify the published SHA-256 when available, then extract into `<7DTD_SERVER_ROOT>/Mods/`.
3. Confirm `ModInfo.xml` is directly under `<7DTD_SERVER_ROOT>/Mods/ServerAdmin/`; correct `Mods/ServerAdmin/ServerAdmin/` by moving the inner directory contents.
4. Start the dedicated server and wait for ServerAdmin mod load. Open the configured URL; `http://localhost:<PORT>/` only works from the server host. A permitted remote browser uses `http://<SERVER_HOST>:<PORT>/` with the actual server host name or permitted/private IP, subject to firewall and network policy.
5. Sign in with the Release-provided initial account, immediately change credentials, and restrict remote access through network policy.

## Verify the result

- The server log shows the mod loaded without a compatibility or dependency failure.
- The login page opens at the configured URL; sign-in shows Dashboard or a simple read-only page.

## Limits and safety notes

::: warning
Release notes define the game version and prerequisites. Do not install frontend build tooling or frontend sources to diagnose mod loading.
:::

::: danger
Do not expose a known initial credential on a public management port. Change it before remote access and restrict access through a firewall or existing reverse proxy.
:::

## Related pages

- [Upgrade](./upgrade)
- [Initial administrator configuration](./initial-administrator-configuration)
- [Advanced source publishing](./publishing)
- [Backup and recovery](../automation-and-reliability/backup-and-recovery)
- [Troubleshooting](../reference/troubleshooting)
