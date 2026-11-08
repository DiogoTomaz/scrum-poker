# ADR-0002: One active connection per participant

Status: Accepted, 2026-11-08; old-tab rejection contract clarified as requested.

## Context

A duplicated tab may possess the same valid membership credential. Both tabs must
not independently control that membership or repeatedly reconnect and take over.

## Decision

The newest authenticated registration under the room lock becomes authoritative.
Issue a fresh generation; every command must authenticate and validate that generation
under the same lock. Notify the previous connection and reject its later mutations
with HTTP 409 / `participant_connection_replaced`, or the equivalent structured
SignalR failure. A lost notification does not weaken enforcement.

The old tab disables actions and automatic reconnect/resume/retry, and displays
“This participant is active in another tab.” It never automatically reloads or
registers to recover. Explicit “Use this tab” registers a new connection, takes over,
and fetches an authoritative snapshot. Preserve known-inactive state across refresh.
401 remains credential failure; 403 remains insufficient role permission.

## Consequences

This is deterministic and simple, but takeover can interrupt work in another tab.
Commands serialized before takeover may finish; later commands fail. Generation
tokens must not repeat after restart. Connection authority cannot rely on group
removal or client cooperation. Multi-device shared membership is not supported.

Contract: [superseded-tab behavior](../specs/product.md#superseded-tab-contract) and
[authority/error handling](../specs/architecture.md#membership-and-connection-authority).
