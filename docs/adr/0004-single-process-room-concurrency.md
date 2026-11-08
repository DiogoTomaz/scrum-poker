# ADR-0004: Single-process room serialization with SQLite

Status: Accepted, 2026-11-08.

## Context

Concurrent votes, reveals, round starts, takeovers, and disconnect callbacks can
conflict. SQLite is adequate for the initial application; distributed coordination
would add complexity without a current need.

## Decision

Run one API process. A singleton registry provides one asynchronous
`SemaphoreSlim(1, 1)` per room. Route all mutations and authority changes through
it, check state/permissions/generation inside it, use a fresh EF context and a short
transaction, and release in finally. Snapshot reads use the lock for a consistent
persisted/live view. Lock acquisition order resolves races; no fairness is promised.

Persist durable state and room revision atomically. SQLite still has one writer
across rooms; use bounded busy handling. Keep lock entries until safe cleanup is
implemented; never remove an entry with a holder or waiter. No distributed locks.

## Consequences

Vote-before-reveal is included; reveal-before-vote rejects the vote. Room operations
are easy to reason about, while unrelated rooms have separate application locks.
SQLite write contention remains possible. Adding another API process requires
replacing this coordination and active-connection strategy. Tests must exercise
real SQLite and concurrent commands rather than just mocking a lock.

Contract: [room concurrency](../specs/architecture.md#room-concurrency-and-persistence).
