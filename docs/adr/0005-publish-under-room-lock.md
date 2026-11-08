# ADR-0005: Publish notifications while holding the room lock

Status: Accepted, 2026-11-08; publication tradeoff documented as requested.

## Context

Publishing after releasing the lock could reorder publication attempts relative
to committed room operations. An ordered queue or transactional outbox adds machinery.

## Decision

Commit the SQLite transaction, close it, and attempt SignalR publication while still
holding the room lock. Bound send duration with a configurable timeout and release
the semaphore in finally. Publication failure never undoes the database commit.
Use revisions and authoritative snapshots for recovery; no outbox or guaranteed replay.

## Consequences

Publication attempts follow room mutation order without another queue. Slow sends
block later room commands and snapshot reads until the bounded timeout. They must
not hold the SQLite transaction or block writers through an open transaction.

There is a commit/publication crash window. Clients may miss, duplicate, or receive
delayed notifications; a successful send is not proof of receipt. A missed final
event can remain unnoticed until a later event or synchronization. Client revision
handling and reconnect snapshots are required. More reliable or lower-latency
delivery can justify a later outbox/ordered dispatcher decision.

Contract: [publication behavior](../specs/architecture.md#publication-while-holding-the-room-lock).
