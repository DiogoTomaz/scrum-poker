# Scrum Poker backlog and delivery workflow

Status: documentation baseline; no implementation authorized. Accepted identity and
concurrency decisions constrain every story. Remaining product details are identified
in [product](product.md); implementation contracts are in [architecture](architecture.md).

## Specification-driven workflow

For each story: review acceptance examples and open decisions, specify affected
HTTP/event contracts, map examples to meaningful tests, then implement the smallest
vertical slice. Use failing behavioral tests where practical; review specs, tests,
and code together. Update ADRs when changing a significant accepted decision.

When Git/remote work is authorized, use short-lived branches and focused PRs linked
to story IDs. Proposed policy: protected main, green CI, deliberate human review,
and squash merges. Adapt approval requirements for a solo maintainer. AI drafts do
not replace review of assumptions or independent test expectations.

Ready means scope, blocking decisions, acceptance examples, contracts, and test plan
are agreed. Done means criteria pass, relevant checks pass, authorization/error cases
are covered, docs are current, and review is complete. Report commands actually run
and limitations. Documentation-only changes need content/link checks, not app tests.

Proposed CI: frontend type/format/lint/build and behavioral tests; backend build,
analyzers, domain tests and real-SQLite transport integration tests; a few multi-client
browser journeys as features arrive. Pin action revisions and use minimal permissions.
Add image/Compose checks when containers exist. Deployment comes after hosting and
backup/migration recovery decisions; promote the same versioned image through
staging and production rather than rebuilding it. No cloud resources are needed now.

## SETUP-001 — Establish the development baseline

As a contributor, I can build, run, and verify the client and API reproducibly so
that each product story starts from a reliable foundation.

Dependencies: explicit implementation authorization; approval of repository structure,
compatible Angular/Node versions, .NET/EF Core pins, package manager, and test tooling.

Acceptance criteria:

- Approved Angular standalone/signals and .NET 10 applications live in `src/web`
  and `src/api`; no Planning Poker behavior is invented during setup.
- SDK/Node versions and package lockfiles are recorded; strict TypeScript, nullable
  C#, formatting/analyzers, and appropriate ignore rules are configured.
- README documents prerequisites and executable local run/build/check commands,
  environment configuration, and the observed need to start Docker for container work.
- Test tooling can execute meaningful available starter checks; no dummy tests or
  implementation-mirroring tests are added solely for coverage or green CI.
- A GitHub Actions workflow defines applicable build/check/test jobs using pinned
  tooling and least privilege. It may be authored locally; no push, remote CI run,
  branch protection change, or PR creation without authorization.
- Include PR/story templates and document the review workflow. Containerization
  can be a subsequent enabling story; no Terraform or deployment in this story.

Verification: run documented checks locally and inspect workflow configuration.
Do not claim remote CI is green until it has actually run.

## SP-001 — Create and resume a room

As a facilitator, I can create a room and invite my team.

Dependencies: SETUP-001; concrete identity/error/snapshot contracts and input limits.

- Given a valid display name, creating a room yields a unique invitation link,
  facilitator membership, and room-scoped credential stored in sessionStorage;
  the database contains only its hash.
- Given invalid input, return validation errors and do not create a partial room.
- Given a refresh, authenticate again and restore the same membership and role;
  fetch the current-generation snapshot before enabling actions.
- Given a superseded generation, return the specified 409 without mutation and
  show inactive UI; no automatic reconnect/takeover. Use this tab explicitly
  takes over and synchronizes. Preserve known-inactive state across refresh.
- Given an invitation alone or another display name, never grant facilitator role.

Tests: HTTP/persistence creation and validation, credential redaction/hash storage,
generation authorization, browser refresh, and a second tab taking over identity.
Retry/idempotency semantics for creation must be specified before implementation.

## SP-002 — Join and observe participants

As a teammate, I can join an invited room and see the team without refreshing.

Dependencies: SP-001; input limits, duplicate-name UX, join idempotency contract.

- Given a valid invite/name, join once and notify existing members. Unknown rooms
  produce a clear error. Retrying an identified join does not duplicate membership.
- Given a refresh/reconnect, restore the same membership, synchronize the snapshot
  and buffered events, and preserve any vote once voting exists.
- Given a duplicate credential in another tab, the newest registration wins;
  previous-tab mutations return `409 participant_connection_replaced` even when the
  replacement notification is lost. A separately joined tab has its own identity.
- Given a temporary disconnect, preserve membership/role and apply the configurable
  grace period only to visible presence. A stale timer cannot disconnect a replacement.
- Given facilitator disconnect, never promote anyone. Connected participants remain
  able to vote once SP-004 exists; facilitator-only actions wait for their return.
- Document/test grace configuration default/range, restart behavior, revision gaps,
  snapshot overlap, and buffer overflow recovery.

Tests: two browser contexts, reconnect/takeover integration tests, fake-clock grace
tests, and deterministic snapshot/event race tests. No host transfer or durable
identity across closed browser sessions is promised.

## SP-003 — Start a titled round

As a facilitator, I can start one estimation round visible to the whole room.

Dependencies: SP-002; confirm deck/title rules and limits; define start idempotency.

- Given a connected facilitator and valid title, start a round with a unique round
  ID and the agreed deck; all clients observe the committed state.
- Given a non-facilitator, reject with 403. Given a stale generation, reject with
  the supersession 409. Empty/oversized titles fail validation.
- Given concurrent starts or an already voting round, create at most one active
  round and return a conflict/defined duplicate result to the other request.
- Given facilitator disconnect, other members cannot start a round on their behalf.

Tests: domain transition/validation, role and generation checks, SQLite concurrency,
and a multi-client start notification journey. No backlog integration.

## SP-004 — Submit and change a private estimate

As a participant, I can submit and change my estimate until reveal.

Dependencies: SP-003; concrete vote command contract and duplicate behavior.

- Given an active round and valid deck value, save my selection. Submitting a new
  selection replaces it; other participants see only submission status.
- Given any pre-reveal snapshot, notification, or error, other members' values are
  absent. My own snapshot includes only my selection.
- Given invalid values, unauthorized membership, superseded generation, or stale
  round ID, reject without changing votes using the specified error semantics.
- Given simultaneous votes by different members, preserve both. Do not reject one
  merely because another unrelated vote advanced room revision.
- Given disconnect/reconnect, restore the saved vote through an authorized snapshot;
  other members can keep voting while the facilitator is disconnected.

Tests: domain rules, actual payload privacy, two-writer integration tests, and
multi-client submit/change/reconnect. Reveal remains SP-005.

## SP-005 — Reveal and begin another round

As a facilitator, I can reveal estimates and start another clean round.

Dependencies: SP-004; confirm manual early reveal and next-round rules.

- Given reveal, every current member receives the same committed results and
  explicit non-voter status. Repeating reveal for the same round is harmless.
- Given a vote/reveal race, lock acquisition order decides: vote first is included;
  reveal first rejects the subsequent vote. Votes cannot change revealed results.
- Given non-facilitator or stale-generation commands, reject with the specified
  403/409. A disconnected facilitator is not replaced automatically.
- Given a revealed round, the facilitator starts the next titled round with a new
  round ID and empty selections; stale commands cannot affect it.
- Given a failed notification after commit, committed state remains available in
  the next snapshot. Do not imply transaction rollback or exactly-once delivery.

Tests: transition and race integration tests plus one browser journey covering join,
private vote, reveal, next round, and facilitator reconnect. No history screen or
calculated consensus.

## Later work and unresolved decisions

After the five stories: containerization, room expiry/retention and operational
limits, backup/restore and deployment migrations, host recovery/transfer if needed,
hosting selection, deployment automation, and Terraform. Basic reconnect is already
in SP-001/SP-002; it is not deferred.

Before SETUP-001: select versions/tooling, confirm repository layout and review policy,
and authorize scaffolding/dependency installation. Before each affected product story:
finalize endpoint/DTO schemas, idempotency, input limits and listed product rules.
Choose lock wait, notification send, SQLite busy, and grace settings with tests;
they are configurable implementation details, not new product behavior.
