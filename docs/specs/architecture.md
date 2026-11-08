# Scrum Poker architecture specification

Status: Approved identity, reconnect, single-process concurrency, and SQLite
decisions, with implementation contracts specified here. Repository organization,
exact versions, and delivery settings remain proposed where noted. Implementation
is not authorized. See [ADRs](../adr/README.md).

## Structure and stack

Planned stack: Angular 20+ standalone components and signals, .NET 10 Web API,
SignalR, EF Core/SQLite, Docker Compose, GitHub Actions; Terraform later.
Proposed structure is a monorepo and feature-organized modular monolith:

```text
AGENTS.md
README.md                    # project overview; run instructions added in SETUP-001
src/web/                     # Angular workspace, colocated unit tests
src/api/                     # one API project; features/domain/persistence/realtime
tests/api/                   # unit and real-SQLite integration projects
tests/e2e/                   # isolated browser contexts
docs/specs/                  # behavior, architecture, stories
docs/adr/                    # decisions and consequences
.github/                    # workflows and review templates, when authorized
infra/                      # deployment configuration later
```

Create directories only when useful. Select/pin Angular, compatible Node, .NET SDK,
EF Core, and test tools in SETUP-001. The initial inspection is retained in
[the historical proposal](../initial-proposal.md#inspection-on-2026-11-08); recheck
the environment before setup. No extra framework, broker, or distributed lock is needed.

Proposed transport split: HTTP for commands and snapshots; SignalR for notifications
and connection registration. Both delegate to shared application services. Domain
rules stay out of endpoints/hubs. Persistence entities are not response contracts.

## Membership and connection authority

Use cryptographically random resume credentials with sufficient entropy. Persist
only their hashes and membership associations in SQLite. No raw secret in database,
URLs, logs, or snapshots. Browser sessionStorage keys must be scoped to room ID.
Transport credential exchange and exact endpoint/schema names must be finalized in
SP-001 before code; use HTTPS in deployment and redact authentication material.

A singleton active-connection registry tracks the current generation and connection
for each room membership. A generation is opaque, server-issued, and must not be
reused after process restart (for example, use random tokens). It is an authority
version, not a substitute for authenticating the resume credential.

Successful connection registration under the room lock supersedes any previous
generation. Reconnection authenticates again and obtains a new generation. Every
mutation and snapshot request authenticates membership and validates the supplied
generation against the active registry inside the room lock. For hub calls also
bind generation to the invoking connection. HTTP calls require the same current
generation and membership authentication. Reject missing generations rather than
implicitly taking over. Only explicit connection registration can take over.

Old connections must no longer receive private participant projections. Room-group
membership alone is not authorization. Notify the old connection and detach/close
it where possible; do not depend on delivery or disconnection for correctness.

### Error envelope

HTTP errors use Problem Details (`type`, `title`, `status`, `detail`, `instance`)
with stable `code` and a diagnostic `traceId`; never include secrets or private votes.
For example, supersession has status `409`, code
`participant_connection_replaced`, and title `Participant connection replaced`.
SignalR registration/control or any future command invocation uses a structured
failure `{ code, status, message, traceId }` with the same semantics, rather than
parsing exception strings. Do not create SignalR mutation endpoints unnecessarily.

`401 invalid_participant_credential` means authentication failed;
`403 forbidden` means a current participant lacks permission;
`409 participant_connection_replaced` means a valid member has a stale generation;
`409 round_conflict` or `409 revision_conflict` requires resynchronization;
`400 validation_failed` means input is invalid. Check active-generation authority
before returning domain errors to a superseded member. Clients do not blindly retry
mutations or automatically reclaim a superseded membership.

## Room concurrency and persistence

One API process owns a singleton registry of per-room `SemaphoreSlim(1, 1)` locks.
All room mutations use it: HTTP/hub operations, connection registration/takeover,
disconnect handling, and grace-timer callbacks. No alternate write path may bypass it.
Order is lock acquisition order, without FIFO or client-clock guarantees.

For each mutation:

1. Authenticate the credential and resolve room/membership. Acquire the room lock
   with cancellation and a bounded wait. Revalidate identity and authority after entry.
2. Create a fresh scoped EF Core context and read current committed state. Check
   current generation, membership, role, round ID, and applicable revision preconditions.
3. Apply one operation in one transaction; increment room revision with committed
   observable changes. Persist revision with durable state; build authorized payloads.
4. Commit and dispose the transaction before network sends. Publish notifications
   in that same room critical section with a bounded send duration.
5. Release the lock in `finally`, including validation, persistence, cancellation,
   and publication failures.

Presence-only changes also advance the room revision under the lock. Persist the
revision before publishing them, so durable and transient views share an ordered
revision sequence. On restart, discard connection authority and rebuild disconnected
presence; clients must register and snapshot again. Document restart revision handling
in SP-002 so pre-restart callbacks/events cannot be applied to a new generation.

A vote that acquires the lock before reveal is included. A vote admitted after
reveal is rejected. Competing round starts cannot create two active rounds.
Generation validation under the same lock makes takeover-versus-action ordering
equally explicit. Snapshot reads also use the room lock for a consistent combined
view of persisted state and the live connection registry.

Do not require a whole-room expected revision on every vote: unrelated participants'
votes should not cause needless rejection. Round ID and current phase protect votes;
use expected revisions only where the command contract requires them. Define each
operation's duplicate/retry behavior before implementation. Repeat reveal for the
same revealed round is harmless; stale round commands never affect a new round.
Create/join/start need an idempotency strategy before retry support is enabled.

SQLite transactions provide atomic persistence; the room semaphore provides business
ordering. SQLite still serializes writers across different rooms: keep transactions
short, configure bounded busy handling, and return a documented retryable failure
if contention outlasts the budget. Never hold a database transaction during SignalR
publication. Different room locks do not imply simultaneous database writes.

Keep lock entries initially; do not remove an entry while held or awaited. Any later
cleanup must coordinate room expiry and reference counts so two locks cannot exist
for the same room. Room capacity/expiry bounds are needed before public deployment.

### Publication while holding the room lock

This preserves publication-attempt order and avoids a second queue or outbox in the
MVP. Slow SignalR sends delay subsequent operations and snapshots in that room.
Use a configurable bounded send timeout, log safe diagnostics on failure, release
the lock, and keep the database commit. A timeout/cancellation after commit must not
be reported as a rolled-back mutation. Return the committed result if the response
channel remains available. A lost HTTP response is an uncertain outcome; resync
before retrying unless the command has explicit idempotency protection.

No atomic guarantee exists between SQLite commit and SignalR publication. A crash
or timeout may lose a notification; completion of a send does not prove receipt.
Revisions, snapshots, and reconnect recover state. A missed final event may remain
unnoticed until a later event, explicit refresh, or reconnect; guaranteed bounded
delivery would require a later reliability decision. Clients must tolerate duplicate
and delayed events. No outbox, replay log, or exactly-once delivery is claimed.

## Authoritative snapshot

Proposed snapshot contract, to be captured as concrete DTO schemas in SP-001/SP-002:

| Field | Meaning and authorization |
| --- | --- |
| `roomId`, `revision` | Stable room ID and consistent committed room revision. |
| `facilitatorId` | Current facilitator membership ID; never inferred from presence. |
| `self` | Requester's participant ID, display name, role, current generation, and allowed actions. Server rechecks all permissions on commands. |
| `participants[]` | Participant ID, display name, role, visible presence, and `hasVoted` for the current round. No credentials or other members' generations. |
| `round` | Null before the first round; otherwise round ID, title, phase (`voting`/`revealed`), and deck. |
| `ownVote` | Requester's current selection, or null; scoped to the current round. |
| `results` | Absent before reveal; after reveal, participant IDs and their saved selections or explicit not-voted status. |

Never include resume credentials, credential hashes, transport connection IDs,
hidden votes, or previous-round values in a current-round snapshot. Project separately
for each authenticated recipient; do not broadcast a snapshot containing `ownVote`.
Shared notifications contain only universally authorized information; use targeted
messages if participant-specific data is needed.

Fetch the snapshot after initial registration/join, page refresh, reconnect, explicit
Use this tab takeover, an event revision gap, or a round/revision conflict. Do not
fetch or register automatically after supersession. A user may also request refresh
while active. Snapshot fetching never itself registers or takes over a connection.

Establish the event subscription before fetching. Buffer events for the current
generation while synchronizing; apply snapshot revision R, discard events at or below
R, then apply contiguous later revisions. A duplicate is ignored; a gap triggers
another snapshot. Tag responses and local subscription callbacks with their generation
so a late snapshot/event cannot reactivate a superseded tab. If any revision has no
visible payload for a recipient, send an authorized revision-only notification so
normal filtering does not appear as a gap. Enable actions only after a consistent
current-generation state is installed. Bound buffering; on overflow, resnapshot.

## Presence and disconnect lifecycle

On disconnect, cease connection authority immediately. Delay only the visible
disconnected status by `Presence:DisconnectGracePeriod`. Default/range and lock/send/
SQLite timeout values are implementation settings to select and document with tests.
Expiry callbacks acquire the room lock and verify generation before changing presence.
A returning or replacement generation cancels/invalidates older callbacks. Roles and
votes are unaffected. No automated facilitator promotion exists.

## Verification and deployment boundaries

Test with real SQLite and independent client identities: two votes, vote/reveal,
competing starts, takeover/action, stale disconnect callback, snapshot/event overlap,
missed replacement notification, and privacy before/after reveal. Assert both state
and transport responses; coordinate concurrency with barriers rather than sleeps.

Proposed deployment: one API instance, SQLite in a persistent API volume, Angular
served behind a same-origin proxy, Compose for local containers. No separate SQLite
container. Hosting, backup/restore, migrations in deployment, room retention, and
Terraform are deferred decisions. A second API process would invalidate the lock
and connection-authority assumptions and requires a replacement architecture.
