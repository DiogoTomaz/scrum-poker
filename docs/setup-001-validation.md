# SETUP-001 validation

This record describes local evidence, not a GitHub Actions result. Changes remain
uncommitted for user review. See [startup and check commands](../README.md).

## Scope and decisions

- Angular standalone/signals shell and .NET Minimal API liveness endpoint.
- Explicit Angular ESLint, non-watch Vitest, xUnit/WebApplicationFactory integration.
- Docker/Compose and CI container smoke validation are included by user approval.
- No EF Core initialization, SQLite files, SignalR hubs, or Planning Poker features.
- [ADR-0006](adr/0006-bootstrap-tooling-and-local-runtime.md) records new decisions;
  accepted ADRs 0001–0005 are preserved.

## Executed local checks (2026-11-18)

Commands below were executed on Windows with Node 22.17.1, npm 10.9.2, .NET SDK
10.0.403, Docker CLI 25.0.3, and Compose 2.24.5-desktop.1.

| Command / check | Result |
| --- | --- |
| `npm install --no-fund --no-audit` in `src/web` | Passed; generated public-registry package lockfile. |
| `npm run format` then `npm run format:check` | Passed. |
| `npm run lint` | Passed; Angular ESLint covers TypeScript and HTML. |
| `npm test` | Passed: 6 Vitest tests, non-watch mode. |
| `npm run build` | Passed: production bundle, 130.31 kB initial raw size. |
| `npm ls --depth=0` | Passed; all direct versions match package.json. |
| `dotnet restore ScrumPoker.slnx --locked-mode --configfile NuGet.Config` | Passed. |
| `dotnet format ScrumPoker.slnx --verify-no-changes --no-restore` | Passed. |
| `dotnet build ScrumPoker.slnx --configuration Release --no-restore` | Passed: zero warnings/errors. |
| `dotnet test ScrumPoker.slnx --configuration Release --no-build --no-restore` | Passed: 1 integration test. |
| Native API startup and `GET /api/health` | Passed: HTTP 200, exact body `Healthy`. |
| Angular dev server and proxied `GET /api/health` | Passed: application shell served; proxy returned HTTP 200, text/plain, exact body `Healthy`. |
| `docker compose config --quiet` | Passed. |
| `docker manifest inspect` for all four Dockerfile base-image tags | Passed: explicit tags exist with Linux platform manifests. |
| Workflow YAML parse using Prettier's bundled parser | Passed; all 5 action references use verified commit SHAs. This is not remote workflow execution. |
| Local Markdown links/fragments and intended Git file scan | Passed: 44 links across 61 intended files; no secret/private-path pattern matches or trailing whitespace. |
| `git diff --check` and accepted ADR comparison | Passed; ADRs 0001–0005 unchanged, no staged changes. |

## Dry-run evidence (2026-11-18)

`npm ci --dry-run --ignore-scripts --no-audit --no-fund` passed its lockfile
consistency check. It did not perform a clean installation or execute lifecycle
scripts. Actual project dependencies were installed with `npm install`; a full
`npm ci` run remains unverified locally and is configured in CI.

## Executed-check context

Native smoke checks used a temporary ignored helper to start the built API and
Angular dev server, check HTTP responses, and stop their processes in a finally
block. This is HTTP smoke evidence, not a real-browser end-to-end test. The commands
in the README let contributors repeat startup and requests without that helper.

Frontend pins: Angular runtime/compiler 21.2.26; CLI/build 21.2.30; TypeScript 5.9.3;
RxJS 7.8.2; tslib 2.8.1; Vitest 4.0.8; jsdom 28.0.0; angular-eslint 21.4.0;
ESLint 10.15.0; @eslint/js 10.0.1; typescript-eslint 8.73.0; Prettier 3.10.1.
Backend package pins are listed in the README and test project; transitive versions
are recorded in both NuGet lockfiles.

Supported ESLint 10 and compatible TypeScript ESLint were selected without
force/legacy-peer overrides. There are no architectural or business-scope deviations
from the approved plan. Container validation remains an explicit environment limit.

## Unverified checks

The evidence above does not include a full clean `npm ci`, a real-browser E2E test,
or remote CI execution. The frontend suite uses jsdom and mocked HTTP; the native
smoke test exercises real HTTP and the Angular development proxy.

Docker image builds, actual runtime probe execution, Nginx configuration execution,
Compose startup, and the Nginx-to-API smoke check could not run locally: the Docker
engine's named pipe is absent. Dockerfiles assert wget exists; CI also checks it and
the proxied response. Alpine image selection supplies BusyBox wget, but runtime
validation still needs the engine. Container config/tag checks do not prove startup.

GitHub Actions has been authored but not remotely executed. Its container job is
intended to close these runtime gaps after authorized publication. No push, PR,
deployment, commit, or staging was performed.

## Environment limitations

The restricted command environment blocks .NET formatter/test-host named pipes,
esbuild child processes, and external package requests. Those checks used approved
execution outside the sandbox.
Repository npm and NuGet configuration uses public sources rather than machine-specific
feeds. No system-wide development tool version is changed.

Docker CLI and Compose are present, but the Windows engine named pipe was absent
at inspection. Image manifests can be verified without an engine; that does not
prove images build or services start. GitHub Actions cannot be reported as run until
the user authorizes publication and the workflow actually executes.

## Publication review (2026-11-19)

The independent reviewer reported no P0, P1, or P2 findings. The accepted P3 concerns
the separately added agent kit: its documentation references skill/agent files that
the current shared ignore rules exclude. Per the user's decision, the entire kit
is deferred to a dedicated PR, not partially published with SETUP-001.

All existing files under `docs/agent-kit/`, `.agents/`, and `.codex/` are preserved.
The shared `.agents/` and `.codex/` ignore rules remain unchanged. Local-only
`.git/info/exclude` patterns keep `/docs/agent-kit/` and `*.zip` out of this working
tree's default staging candidates. These exclusions are not committed; revisit
the documentation exclusion and shared kit ignore policy in the dedicated kit PR.
There are no SETUP-001 links that require the deferred kit to exist in a checkout.

The intended commit contains bootstrap application/test projects, version pins and
lockfiles, Docker/Nginx/Compose, CI and review templates, ADR-0006, and the directly
related project/specification/validation documentation. No application code was
changed during this publication-preparation pass. Passing application suites above
were not rerun for documentation-only preparation; publication checks are separate
from the recorded 2026-11-18 build/test evidence.

Preparation checks executed on 2026-11-19:

- SHA-256 comparison confirmed all 9 existing kit files are unchanged.
- The exact local commit manifest, `.cache/setup-001-files.txt`, lists 54 changed/new
  SETUP-001 files. It is a local review artifact, not part of the commit.
- Scope/artifact checks excluded kit paths, ZIP archives, generated binaries,
  caches, database files, and credential files. No out-of-scope candidates remain.
- All 44 local Markdown links/fragments across 61 eligible repository files passed;
  content scanning found no secret/private-path patterns or trailing whitespace.
- Public npm lockfile URLs, unchanged ADRs 0001–0005, `git diff --check`, and an
  empty staging area were verified. `docker compose config --quiet` passed again.
- `docker info` still reported the engine named pipe missing; container execution
  and remote GitHub Actions remain unverified. No application suites were rerun.
