# Local Validation Workflow

This project is validated locally. Remote GitHub Actions are intentionally not required for the current single-developer workflow.

## Frontend Gate

Run the full local frontend gate from the frontend repository root:

```bash
pnpm verify:local
```

The command regenerates the OpenAPI client, type-checks application and Playwright configuration code, runs Vitest unit tests, checks locale key parity, analyzes a production build, and runs the critical visual regression suite.

For a faster targeted pass while developing, run only the checks related to the area you changed:

```bash
pnpm typecheck
pnpm test:unit
pnpm visual:critical
```

## Backend Gate

Run backend tests from the backend repository root:

```powershell
dotnet test tests\LSTY.Sdtd.ServerAdmin.Tests\LSTY.Sdtd.ServerAdmin.Tests.csproj -v:minimal
```

The backend test project focuses on logic that can be validated without a live 7 Days to Die process: economy safety, event automation validation, Discord command safety, GeoIP policy decisions, localization parsing, and Web API controller contracts.

## Live Server Smoke

When a real backend server is running, run the frontend live smoke check:

```bash
pnpm smoke:live
```

Use `.env` or process environment variables for the base URL and default credentials. This check verifies that key read endpoints, Swagger, Discord status, and GeoIP status are reachable. It does not perform destructive actions or send real Discord messages.

## Manual Acceptance

Run the guided checklist when a change affects Discord, GeoIP, EventAutomation, or real game-server behavior:

```bash
pnpm live:acceptance
```

Manual acceptance is still required for real Discord interactions, game chat bridging, controlled GeoIP join/kick tests, and event automation execution against a live server.

## Suggested Order Before Release

1. Backend: `dotnet test tests\LSTY.Sdtd.ServerAdmin.Tests\LSTY.Sdtd.ServerAdmin.Tests.csproj -v:minimal`
2. Frontend: `pnpm verify:local`
3. Live server: `pnpm smoke:live`
4. Manual: `pnpm live:acceptance`
