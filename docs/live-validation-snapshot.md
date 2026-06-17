# Live Validation Snapshot

Date: 2026-06-17

Frontend commit before this validation: `bde1e0d`
Backend commit before this validation: `1042fdd`

## Automated Checks Passed

Frontend:

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm locale:check`
- `pnpm build:analyze`
- `pnpm smoke:live`
- `pnpm visual:critical`

Backend:

- `dotnet test tests/LSTY.Sdtd.ServerAdmin.Tests/LSTY.Sdtd.ServerAdmin.Tests.csproj -v:minimal`

## Live Smoke Result

The live smoke script reported 7 of 7 checks passed:

- Swagger schema reachable.
- Server settings expose expected 7 Days to Die 3.0 keys.
- Game server read endpoints reachable.
- Known language metadata includes 7 Days to Die 3.0 columns.
- English game items include localized names.
- GeoIP status endpoint reachable.
- Discord bot status endpoint reachable and connected.

## Not Covered By This Automated Snapshot

These checks still require real user/player actions and Discord interaction:

- Sending `/serverstatus` from Discord and confirming the interaction response in Discord.
- Sending `!listplayers` from the configured admin channel and confirming command output is written back to Discord.
- Sending a real game global chat message and confirming Discord receives it.
- Sending a Discord public-channel message and confirming the game global chat receives it.
- Joining the real game server with a controlled IP and confirming GeoIP allow/block decisions and kick messages.
- Triggering a real event automation success rule and failure rule and confirming RunLog, RunStats, audit, and optional Discord failure alert.

Use the feature-specific runbooks for manual acceptance details:

- `docs/discord-integration.md`
- `docs/geoip-access-control.md`
- `docs/event-automation-validation.md`

For a guided manual pass, run:

```bash
pnpm live:acceptance
```

The checklist only records operator confirmation. It does not send Discord messages, join the game server, edit GeoIP settings, or trigger automation rules automatically.
