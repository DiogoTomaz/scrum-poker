# Scrum Poker: coding agent instructions

## Current phase and authority

The initial specifications have been approved as the documentation baseline.
Implementation has not started. Git publication of this documentation-only baseline
is authorized in scope. For the current preparation task, the user will perform the
initial commit manually: do not stage, commit, push, create a PR, or create remote
resources. Publication approval does not override these task-specific limits.

Application scaffolding and dependency installation require separate authorization.
Do not implement application code, provision infrastructure, or deploy without it.
The user's explicit instructions take precedence. Do not treat a proposal as approval.

Read this file, relevant specifications, and accepted architecture decisions before
editing. Inspect the working tree and preserve unrelated user changes. Keep changes
small and reviewable. Ask about material ambiguity; make routine implementation
choices within approved scope. Do not create additional architectural layers or
add libraries without explaining the need.

Before executing significant terminal commands, briefly explain their purpose and
expected effect in user-facing commentary. This includes inspections, build/test
runs, file operations, and Git commands. Group related read-only commands under one
explanation; never expose secrets in explanations or command output.

Read `docs/specs/product.md`, `docs/specs/architecture.md`, and
`docs/specs/backlog.md` as the current specifications. Read relevant `docs/adr/`
records for decision status and rationale. `docs/initial-proposal.md` is historical
and superseded by those documents. Approved decisions do not authorize implementation.

## Product and planned stack

Scrum Poker is collaborative Planning Poker for Agile teams. Learning a professional
AI-assisted development workflow is part of the product objective.

Planned stack: Angular 20+ with standalone components and signals; .NET 10 Web API;
SignalR; EF Core with SQLite; Docker Compose; GitHub Actions; Terraform later.
Exact frontend and tool versions remain pending. Verify official compatibility
before choosing versions. Pin approved SDK/runtime/package versions and commit
lockfiles when application setup is authorized. Do not use floating latest tags.

## Planned organization

- `src/web/`: Angular application, organized by feature; colocated unit tests.
- `src/api/`: one .NET API project with feature folders, domain rules, persistence,
  and real-time adapters separated within the project.
- `tests/api/`: backend unit and integration test projects.
- `tests/e2e/`: browser tests covering multiple participants.
- `docs/specs/`: product rules, numbered stories, acceptance criteria, contracts.
- `docs/adr/`: architecture decisions, explicitly marked Proposed or Accepted.
- `.github/`: PR/issue templates and CI workflows.
- `infra/`: deployment configuration when needed; Terraform deferred.

Do not create empty directories or speculative abstractions merely to match this map.

## Specification-driven changes

1. Identify the story and read its acceptance criteria. For new behavior, draft
   the specification before implementation; obtain review of material product rules.
2. Specify happy paths, validation, permissions, failure cases, and relevant
   HTTP/SignalR contracts. Record open questions and explicit exclusions.
3. Map observable acceptance criteria to meaningful tests. For behavior changes,
   reproduce a failure before fixing it where practical.
4. Implement the smallest complete vertical slice. Keep specs, contracts, tests,
   and implementation consistent. Do not silently change approved behavior.
5. Run relevant checks. Report exact commands, outcomes, and anything not run.
   Never claim a check passed without executing it. Documentation-only changes
   need review of content and links, not application tests.
6. Prepare a PR summary linking the story, explaining behavior, validation,
   migrations, and material limitations. Human review controls merging.

## Implementation conventions (when authorized)

- TypeScript strict mode and C# nullable references; use formatters and analyzers.
- Angular standalone components; signals for local/derived state, RxJS where
  asynchronous streams warrant it. Keep transport code outside presentation code.
- Keep HTTP endpoints and SignalR hubs thin; share application/domain rules.
  The server is authoritative for membership, votes, round state, and permissions.
- Specify command responses and event payloads before coding. Never expose EF
  entities directly as API contracts. Use consistent validation and error responses.
- Before reveal, other participants must never receive hidden vote values through
  HTTP, SignalR, logs, or diagnostic payloads. UI hiding alone is insufficient.
- Validate room membership and facilitator privileges on the server. A connection
  ID or display name alone is not participant identity or authorization.
- Define round transitions and serialize conflicting commands per room. Handle
  duplicate commands and reconnects explicitly; resynchronize from server state.
- Use the approved singleton per-room asynchronous lock with one API process.
  Check active connection generation and permissions inside the room lock.
  Superseded clients become inactive without automatic reconnect or takeover.
- Keep only a room-scoped resume credential in sessionStorage on the client and
  its hash on the server. Refresh restores membership and role. Fetch an authorized
  snapshot after connection establishment/reconnection before enabling actions.
- Persist through EF Core; include reviewed migrations for schema changes. Use
  real SQLite databases for persistence integration tests, isolated per test/run.
- Prefer behavioral unit tests for domain rules, integration tests for persistence
  and transports, and a few browser journeys with separate participant contexts.
  Avoid implementation-mirroring tests and arbitrary sleeps.
- Use accessible semantic controls, keyboard navigation, clear pending/error states,
  and stable test selectors where needed.
- Never commit credentials, local SQLite files, build output, or personal settings.
  Supply example configuration without secrets; use environment configuration or
  development secret storage. Do not log access tokens or private votes.
- No external messages, publishing, deployment, destructive Git operations, or
  remote changes without authorization. Do not bypass required review or CI.

## Collaboration and completion

Use short-lived branches and one focused PR per story or enabling change once
Git work is authorized. Explain the purpose of changes in plain language. Surface
tradeoffs and blockers early. Completion means the acceptance criteria are met,
relevant checks pass, documentation is current, and remaining limitations are clear.
Never invent repository commands: document executable checks after tools exist.
