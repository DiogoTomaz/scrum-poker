# Scrum Poker

A collaborative Planning Poker application for Agile teams, with private estimates,
real-time room updates, and facilitator-controlled reveal.

The project also teaches specification-driven, AI-assisted development: turn product
rules into small user stories, behavioral tests, reviewed pull requests, and CI/CD.

**Current status:** The documentation baseline is approved and published. SETUP-001
provides an Angular shell, API liveness endpoint, tests, local containers, and CI
configuration. Planning Poker business features have not started.

## Planned technology stack

- Angular 21 with standalone components and signals
- .NET 10 Web API and SignalR
- EF Core and SQLite
- Docker Compose and GitHub Actions
- Terraform in a later infrastructure phase

## Specifications and decisions

- [Product specification](docs/specs/product.md)
- [Architecture specification](docs/specs/architecture.md)
- [Backlog and development workflow](docs/specs/backlog.md)
- [Architecture decision records](docs/adr/README.md)
- [Coding agent instructions](AGENTS.md)

## Development roadmap

1. Review SETUP-001: application bootstrap, local checks, containers, and CI.
2. Deliver SP-001 through SP-005: create/resume rooms, join participants, start
   rounds, submit private estimates, and reveal/start the next round.
3. Add operational readiness, including retention, backups, and
   deployment migration procedures.
4. Select hosting, automate deployment, and introduce Terraform when needed.

## Prerequisites and version pins

Use Node **22.17.1**, npm **10.9.2**, and .NET SDK **10.0.403**. Versions are pinned
in [.node-version](.node-version), [package.json](src/web/package.json), and
[global.json](global.json). No global Angular CLI is needed. The SDK pin deliberately
does not roll forward; install that SDK if it is missing.

Angular runtime/compiler packages use **21.2.26**, CLI/build **21.2.30**, TypeScript
**5.9.3**, RxJS **7.8.2**, and Vitest **4.0.8**. All direct frontend dependency pins
are in package.json, including Angular ESLint **21.4.0**, ESLint **10.15.0**,
TypeScript ESLint **8.73.0**, jsdom **28.0.0**, and Prettier **3.10.1**. Transitive
versions are locked in package-lock.json. Backend
tests use xUnit **2.9.3**, runner **3.1.4**, Microsoft.NET.Test.Sdk **17.14.1**, and
Microsoft.AspNetCore.Mvc.Testing **10.0.14**. NuGet lockfiles are included.

Docker with the Compose plugin and Linux containers is needed for the container
workflow. Compose 2.24.5 is the inspected local version. The local engine was
unavailable during initial inspection; start Docker Desktop before container checks.

## Native local startup

From the repository root, restore and start the API in one terminal:

```sh
dotnet restore ScrumPoker.slnx --locked-mode --configfile NuGet.Config
dotnet run --project src/api --launch-profile http
```

In another terminal:

```sh
cd src/web
npm ci --no-audit --no-fund
npm start
```

Open **http://localhost:4200**. The shell checks `/api/health` through Angular's
development proxy to **http://localhost:5000**. A healthy API returns HTTP 200,
`text/plain`, and exactly `Healthy`. This is process liveness, not database readiness.
The UI reports unavailable after a failed request or five-second timeout and offers
a retry. No accounts, rooms, voting, persistence, or SignalR hubs exist yet.

Only development HTTP is configured; no certificate trust step is required. Native
ports are set in [launchSettings.json](src/api/Properties/launchSettings.json) and
[proxy.conf.json](src/web/proxy.conf.json). If changing the API port, change both.
No credentials or environment files are required. Project package sources are public
npm/nuget.org; do not copy private registry credentials into repository configuration.

## Build, lint, format, and test

From `src/web`:

```sh
npm run format:check
npm run lint
npm test
npm run build
```

`npm test` runs Vitest once with `--watch=false`, including in CI. Use
`npm run test:watch` for interactive development. Lint is an explicitly configured
Angular ESLint target covering TypeScript and accessible HTML templates. Run
`npm run format` to apply frontend formatting.

From the repository root:

```sh
dotnet restore ScrumPoker.slnx --locked-mode --configfile NuGet.Config
dotnet format ScrumPoker.slnx --verify-no-changes --no-restore
dotnet build ScrumPoker.slnx --configuration Release --no-restore
dotnet test ScrumPoker.slnx --configuration Release --no-build --no-restore
```

Use `dotnet format ScrumPoker.slnx --no-restore` to apply C# formatting. The initial
backend integration test uses WebApplicationFactory and needs no running API, Docker,
or database. The frontend tests use HTTP test responses and need no running API.
No empty unit/domain/E2E projects are created before there is behavior to test.

## Docker Compose

From the repository root:

```sh
docker compose config --quiet
docker compose up --build --detach --wait --wait-timeout 120
```

Open **http://localhost:8080**. Only Nginx is published, bound to loopback; the API
is private to the Compose network. Nginx preserves `/api` while proxying to the API.
Images are pinned to Node `22.17.1-alpine3.22`, Nginx `1.28.0-alpine`, .NET SDK
`10.0.403-alpine3.24`, and ASP.NET runtime `10.0.14-alpine3.24`. The API runs as
the runtime image's non-root application user. Runtime health probes use BusyBox
`wget`, checked during image builds and CI. No extra probe package is installed.

Check the full frontend-to-backend proxy path (Bash or a shell with curl):

```sh
curl --fail http://localhost:8080/
curl --fail http://localhost:8080/api/health
```

The second response must be exactly `Healthy`, not the Angular HTML fallback.
In Windows PowerShell, use `curl.exe` or
`Invoke-RestMethod http://localhost:8080/api/health`.

```sh
docker compose logs --no-color
docker compose down --remove-orphans
```

The native dev server supports live reload. Compose serves a compiled frontend;
rebuild after source changes. Compose has no database service/volume because SQLite
initialization is deferred. Production TLS, hosting, backups, and deployment are
outside SETUP-001.

## CI and review

[CI](.github/workflows/ci.yml) runs frontend format/lint/non-watch tests/build,
backend format/build/integration tests, and a container smoke job on PRs targeting
main and pushes to main. Actions are pinned to commit SHAs and use read-only
repository permissions. The container job builds both images, waits for health,
checks probe utilities, requests the frontend and proxied `/api/health`, verifies
API 404 routing, then cleans up. It does not publish images or deploy anything.

Use a short-lived story branch, follow the [workflow](docs/specs/backlog.md), and
include acceptance criteria and actual test evidence in the
[PR template](.github/pull_request_template.md). Local validation does not prove
GitHub Actions passed. See [SETUP-001 validation](docs/setup-001-validation.md) for
the checks actually executed and remaining limitations.
