# ADR-0006: Bootstrap tooling and local runtime

Status: Accepted, 2026-11-18, through approval of the SETUP-001 implementation plan.

## Context

The approved documentation needs a reproducible application foundation and useful
checks before product stories. Node 22.17.1 and .NET SDK 10.0.403 are already installed.
The accepted room identity/concurrency decisions are not needed by a bootstrap shell.

## Decision

- Use Angular 21, standalone components, signals, strict TypeScript, and client-side
  rendering. Pin compatible versions with npm and package-lock.json. Use the Angular
  CLI Vitest integration and explicit Angular ESLint flat configuration and lint target.
- Use one .NET 10 Minimal API project and an xUnit/WebApplicationFactory integration
  project. Pin the SDK in global.json and dependencies in NuGet lockfiles. No empty
  domain test projects, EF Core initialization, SignalR hubs, or business endpoints.
- `GET /api/health` is unauthenticated process liveness: HTTP 200, `text/plain`, body
  exactly `Healthy`. It does not check database readiness. Use built-in health checks.
- Show a small frontend service-status shell. Keep HTTP transport in one injectable
  service, with a five-second timeout; signals represent pending/available/unavailable
  UI state. Test successful, failed, unexpected, and retried requests.
- Use multi-stage builds and explicit image versions. Compose runs API and Nginx;
  only Nginx is published, on loopback port 8080. Nginx preserves `/api` when proxying
  to the API. Native development uses the Angular proxy to localhost port 5000.
- Alpine runtime images supply BusyBox wget for health probes; Dockerfiles and CI
  explicitly check for it. The API runs as its image's non-root application user.
- CI validates build/test/lint/format and container startup. Tests run once, actions
  are pinned to verified SHAs, permissions are read-only, and no images are published.

## Consequences

The bootstrap works with existing tool versions and avoids additional application
layers. Exact tool/image pins need deliberate updates; lockfiles make dependency
resolution repeatable. Nginx and native proxy configuration must preserve the same
API path behavior. Local HTTP is for development; production TLS/hosting is a later
decision. No database container or empty database volume is needed yet.

Container smoke checks verify actual proxied health responses, not only service
status. They are required in CI even if the local Docker engine is unavailable.
Missing local runtime validation must be documented; authoring CI is not proof it ran.
Accepted ADRs 0001–0005 remain unchanged and govern later product implementation.
