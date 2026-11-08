# Scrum Poker: initial proposal

Status: Historical proposal, superseded by [product](specs/product.md),
[architecture](specs/architecture.md), [backlog](specs/backlog.md), and
[decision records](adr/README.md). Retained for the original inspection and proposal
history. Approval status and current behavior must be read from the new documents;
in particular, basic reconnect/resume now belongs to the initial product stories.
No application scaffolding, dependency installation, or remote changes are authorized.

## Inspection on 2026-11-08

The directory initially contained only `.git`: branch `main`, no commits, no
configured remote, and a clean working tree. No existing project instructions or
application files were present.

| Tool | Observed version/status |
| --- | --- |
| Git | 2.47.1.windows.2 |
| Node.js / npm | 22.17.1 / 10.9.2; npx also on PATH |
| .NET SDKs | 8.0.426, 9.0.320, 10.0.403 |
| .NET / ASP.NET Core 10 runtime | 10.0.14 |
| Docker CLI / Compose | 25.0.3 / v2.24.5-desktop.1 |
| Docker engine | Not reachable: docker_engine named pipe missing; not started by this inspection |
| Terraform | 1.16.6; deferred |
| GitHub CLI (`gh`) | Not on PATH; optional, browser-based PRs are sufficient |
| VS Code / ripgrep | On PATH |

No dependencies were installed and no global Angular CLI was invoked. Project-local
CLI availability will be established during authorized setup. Node 22.17.1 fits
Angular 20/21's published matrix, but not Angular 22's Node 22.22.3 minimum. Approve
the Angular major and any required Node update together. .NET 10 is available.

## Proposed architecture

Use a monorepo and a modular monolith: one Angular client, one .NET backend, one
SQLite database. Organize by feature and keep domain rules independent of transport.
Start with one backend project rather than several layers of projects. Split only
when a concrete dependency or testing need justifies it.

```text
scrum-poker/
  AGENTS.md
  README.md
  .editorconfig
  .gitignore
  global.json
  .node-version
  compose.yaml
  src/
    web/                       # Angular workspace; feature folders and unit tests
    api/                       # API project; Features, Domain, Persistence, Realtime
  tests/
    api/                       # separate unit and integration test projects
    e2e/                       # browser tests with separate participant contexts
  docs/
    initial-proposal.md
    specs/                     # product rules, stories, HTTP/event contracts
    adr/                       # numbered decisions with status and consequences
  .github/
    workflows/
    ISSUE_TEMPLATE/
    pull_request_template.md
  infra/                       # later; Terraform only when hosting is selected
```

Only this document and AGENTS.md are created now. Add other paths when they contain
useful work. No Nx, microservices, message broker, generic repository abstraction,
or global frontend state library is proposed initially.

Use HTTP for commands and snapshots; SignalR sends server-confirmed changes to room
members. Commit a mutation before broadcasting its result. Include a room revision
and round ID so clients can reject stale state and resynchronize after reconnecting.
Concurrent room commands need serialization and defined conflict behavior. A single
backend instance is the initial deployment boundary; horizontal scaling needs a
separate decision about persistence, coordination, and SignalR distribution.

SQLite lives in a persistent volume attached to the API, not a database container.
Compose would run the frontend server and API. Prefer a same-origin proxy for HTTP
and SignalR in deployment; use the Angular development proxy locally. Keep domain
state durable; treat connection presence separately. Restart, reconnect, retention,
and migration behavior must be specified before implementation of those concerns.

## Proposed MVP rules requiring approval

- Guest participation using a display name and an unguessable invitation link;
  no user accounts or external issue-tracker integration in the first milestone.
- A separate secret identifies each participant; invitation access does not confer
  facilitator privileges. Define credential storage and expiration in the contract.
- Room creator is the facilitator and can also vote. Only the facilitator reveals
  and starts a new round. Host transfer/recovery is deferred and needs a documented
  failure behavior; it must not silently elect an unauthorized host.
- One active round per room, with a title and fixed deck: 1, 2, 3, 5, 8, 13, 21, ?.
  Participants may change their selection until reveal. Manual reveal can occur
  before everyone votes; non-voters appear explicitly as not voted.
- Before reveal, each participant sees their own selection and others' submission
  status. Other participants' values are absent from every client payload.
- No automatic consensus calculation or averaging, accounts, history dashboard,
  spectators, or configurable decks in the first five stories.

## Workflow

1. Write a small numbered story in `docs/specs/` with actor, outcome, acceptance
   examples (Given/When/Then), exclusions, and unresolved decisions. Use a local
   file initially; create a linked GitHub issue only when remote work is authorized.
2. Review behavior and relevant ADRs with the product owner. Mark approved decisions
   explicitly. A spec is the behavioral source of truth; an issue tracks delivery.
3. Specify request/response and event schemas, validation, room permissions,
   concurrency, and reconnect behavior for the slice. Record a short implementation
   plan and a mapping from acceptance examples to tests.
4. On a short-lived story branch, write meaningful failing behavioral tests,
   implement the smallest vertical slice, then refactor with tests passing. AI can
   draft specs, code, and tests; a human reviews assumptions and independently
   checks that tests capture the requested behavior.
5. Run local checks and open a focused PR with story links, behavior changes,
   test evidence, screenshots for UI changes, and migration notes when applicable.
   Review specs and tests as carefully as production code.
6. Require CI and human review before squash merging into protected main. With a
   solo maintainer, use a deliberate review checklist and self-review; do not set
   an impossible mandatory second-person approval rule.
7. After hosting is approved, build versioned images from the merged revision,
   deploy to staging, smoke-test, and promote the same images through an approved
   production environment. Define database backup/restore and migration recovery
   before enabling production deployment. Rolling back an image does not undo data.

Definition of ready: small scope, reviewed acceptance examples, agreed contracts,
resolved blocking decisions, and a test plan. Definition of done: acceptance examples
pass, relevant CI is green, errors and authorization are covered, documentation is
current, no secrets or private votes leak, and review is complete.

## CI and test strategy

Begin with an enabling setup PR before product stories: pin compatible versions,
scaffold approved applications, provide local run instructions, and establish
format/lint/build/test checks. Do not create meaningless tests just to make CI green.

On PRs, run frontend type/build/unit checks and backend build/analyzer/unit/integration
checks. Integration tests use temporary real SQLite databases and cover HTTP and
SignalR behavior. Add a small browser suite once cross-client behavior exists:
two isolated participants join, vote privately, reveal, and start another round.
Include negative authorization and hidden-payload assertions at the transport layer.
Use condition-based waits, not sleep-based synchronization. Add image build and
Compose smoke checks when containers exist. CI validates; deployment is a later step.

Use least-privilege GitHub Actions permissions, pinned action revisions, no production
secrets in untrusted PR jobs, and OIDC for cloud deployment where supported. Proposed
test tools: xUnit, ASP.NET Core integration hosting, Angular's selected-version
default unit runner, and Playwright for browser journeys. Confirm versions at setup.

## First five product stories

These are vertical slices after the enabling setup work. Each includes client,
backend, persistence where needed, and tests; do not split into frontend/backend tasks.

| ID | User story | Acceptance examples and boundary |
| --- | --- | --- |
| SP-001 | As a facilitator, I can create a room to invite my team. | A valid display name creates a unique room and invite link and joins the creator as facilitator. Blank/oversized names fail without creating a room. Credentials are separate from the invite link. No account setup. |
| SP-002 | As a teammate, I can join an invited room and see its participants. | A valid invite and name joins the room; existing members see the arrival without refresh. An unknown room returns a clear error. Repeated join requests do not create duplicate membership. Duplicate display names remain distinguishable by participant identity. No host transfer or presence timeout policy yet. |
| SP-003 | As a facilitator, I can start a titled estimation round. | A valid title starts one voting round visible to everyone. A teammate cannot start one; starting while a round is already voting returns a conflict. An empty title is rejected. No backlog integration. |
| SP-004 | As a participant, I can submit and change a private estimate. | A deck value is saved for the current round; changing it replaces my previous choice. Others see submission status but never its value through HTTP or SignalR. Invalid values, nonmembers, and stale round IDs are rejected. No reveal yet. |
| SP-005 | As a facilitator, I can reveal estimates and begin another round. | Reveal shows the same saved estimates and explicit non-voters to all members. Non-facilitators cannot reveal; votes after reveal are rejected. The facilitator starts the next titled round with no carried-over selections. Repeated reveal is harmless; reveal/vote races have a defined server order. No history screen or calculated consensus. |

Follow-on stories: reconnect/resume with resynchronization, participant departure and
host recovery, room expiry, and operational readiness. Define minimal disconnect
behavior in initial contracts; automatic recovery is not implied by these stories.

## Approval decisions

1. Repository and architecture: monorepo, one feature-organized backend, single API
   instance initially, HTTP commands/snapshots plus SignalR notifications.
2. Tool versions: exact Angular major (20+), compatible Node release, .NET 10 SDK and
   EF Core 10 packages; npm as the initial frontend package manager. Pin exact
   versions during setup rather than selecting floating versions now.
3. MVP rules above: guest access and credential model, facilitator authority, fixed
   deck, manual reveal, title requirement, and initial scope. These affect contracts
   and security tests and should be agreed before implementing stories.
4. Delivery practice: story-first specs, small PRs, squash merge, protected main,
   and human review adjusted for solo/team ownership.
5. Next step authorization: documentation/templates and application setup as a
   separate enabling change. No setup is authorized by accepting this proposal alone
   unless the user explicitly requests it.

Hosting provider, production retention/backup targets, production identity needs,
operational limits, Terraform layout, and deployment approvals can wait until the
deployment milestone. Do not provision cloud infrastructure in advance.

## References

- [Angular compatibility matrix](https://angular.dev/reference/versions): check the
  chosen Angular version against Node and TypeScript before setup.
- [EF Core SQLite limitations](https://learn.microsoft.com/en-us/ef/core/providers/sqlite/limitations):
  review schema migration constraints before designing deployment migrations.
