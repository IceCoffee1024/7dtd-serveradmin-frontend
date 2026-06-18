# Live Validation Snapshot

Date: 2026-06-19

Frontend commit before this validation: `17c7f91`
Backend commit before this validation: `e82e34f`

## Deployment Step

Backend was published with:

```powershell
dotnet publish src\LSTY.Sdtd.ServerAdmin\LSTY.Sdtd.ServerAdmin.csproj /p:PublishProfile=FolderProfile1
```

Publish target:

```text
\\172.16.168.25\7 Days to Die Dedicated Server\Mods\ServerAdmin
```

The server was restarted through `POST /api/GameServer/ExecuteConsoleCommand` with command `ty-RestartServer`. The API returned:

```text
Shutting server down...
```

Swagger recovered after restart:

```text
HTTP 200, non-empty swagger document
```

## Automated Checks Passed

Backend:

```powershell
dotnet test tests\LSTY.Sdtd.ServerAdmin.Tests\LSTY.Sdtd.ServerAdmin.Tests.csproj -v:minimal
```

Result:

```text
134 passed, 0 failed, 0 skipped
```

Frontend:

```powershell
$env:CI='true'; pnpm verify:local
```

Result summary:

- `pnpm api:gen` completed from `http://7dtdserver.local:8088/swagger/v1/swagger.json`.
- `pnpm typecheck` passed.
- `pnpm typecheck:playwright` passed.
- `pnpm test:unit` passed: 2 files, 5 tests.
- `pnpm locale:check` passed: 13 locale files aligned with `en.json`, 2817 leaf keys each.
- `pnpm build:analyze` passed.
- `pnpm visual:critical` passed: 42 Playwright tests.

Post-publish API sync:

```powershell
pnpm api:gen
pnpm typecheck
pnpm locale:check
```

Result:

- API generation completed from live Swagger.
- Typecheck passed.
- Locale check passed.

## Live Smoke Result

The first smoke run immediately after restart failed because game-server-dependent endpoints returned `503 Service Unavailable` with `The game server is still initializing.` After the server finished initialization, the smoke script passed.

```powershell
pnpm smoke:live
```

Final result:

```text
Live smoke passed: 8/8 checks passed.
```

Checks passed:

- Swagger schema reachable: 161 paths.
- Server settings expose expected 7 Days to Die 3.0 keys: 68 settings.
- Game server read endpoints reachable: Stats, Config, AllowedCommands, OnlinePlayers, HistoryPlayers, MapInfo, LandClaims, Mods.
- Known language metadata includes 7 Days to Die 3.0 columns.
- English game items include localized names: 686 items, 686 localized.
- GeoIP status endpoint reachable: `enabled=false`, provider `IpWhoIs`.
- Discord bot status endpoint reachable and connected: `running=true`, `ready=true`.
- Player Tracking endpoints reachable: `enabled=true`.

## Generated API Changes

Post-publish `pnpm api:gen` updated generated frontend API files for player inventory compensation execution item details:

- `src/generated/api/types.gen.ts`
- `src/generated/api/valibot.gen.ts`

## Not Covered By This Automated Snapshot

These checks still require real player actions, Discord interaction, or operator confirmation:

- Player Tracking: join a real server with a test player, confirm session creation, chat activity, leave/session close, optional location sample, optional inventory snapshot, cleanup result, and Module Center runtime state.
- Discord: send `/serverstatus` from Discord and confirm the interaction response in Discord.
- Discord: send `!listplayers` from the configured admin channel and confirm command output is written back to Discord.
- Discord: send a real game global chat message and confirm Discord receives it.
- Discord: send a Discord public-channel message and confirm the game global chat receives it.
- GeoIP: join the real game server with a controlled IP and confirm allow/block decisions and kick messages.
- Event Automation: trigger a real success rule and failure rule and confirm RunLog, RunStats, audit, and optional Discord failure alert.

Use the feature-specific runbooks for manual acceptance details:

- `docs/player-tracking.md`
- `docs/discord-integration.md`
- `docs/geoip-access-control.md`
- `docs/event-automation-validation.md`

For a guided manual pass, run:

```bash
pnpm live:acceptance
```

The checklist only records operator confirmation. It does not send Discord messages, join the game server, edit GeoIP settings, or trigger automation rules automatically.
