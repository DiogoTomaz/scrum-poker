# ADR-0003: Snapshot recovery and facilitator presence

Status: Accepted, 2026-11-08; snapshot and grace-period details clarified as requested.

## Context

Refresh, transient disconnects, and lost notifications must not create duplicate
memberships, discard votes, expose hidden values, or silently transfer authority.

## Decision

Preserve membership, vote, and role across disconnects. Reauthenticate and fetch an
authoritative, recipient-authorized snapshot before enabling actions after connect,
refresh, reconnect, or explicit takeover. Recover revision gaps/conflicts by snapshot.
Subscribe before fetching and reconcile buffered events by generation and revision.
Superseded clients stay inactive instead of automatically recovering.

The snapshot includes room/revision, facilitator, self identity/role/generation,
roster/presence/submission status, round/deck, own vote, and results only after reveal.
Never include other hidden votes or credentials. The full contract is in
[architecture](../specs/architecture.md#authoritative-snapshot).

Use configurable `Presence:DisconnectGracePeriod` for visible presence only; select
default/range in SP-002. Authority ceases immediately on disconnect. Generation-aware
callbacks prevent stale timers from affecting replacement connections.

Never automatically promote a facilitator. Other members can vote in an active
round; reveal and starting another round wait for the facilitator's return.

## Consequences

Short outages do not lose identity or votes. Synchronization needs explicit client
states and payload privacy tests. An absent facilitator may block the room forever
if their secret is lost. Host recovery/transfer and retention remain deferred.
